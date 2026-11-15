import { randomUUID } from 'node:crypto'
import { resolveSummaryConfig, summarizeConversation } from './summary.js'

/** Domain failure with an HTTP-friendly status and stable code. */
export class HandoffError extends Error {
  constructor(message, { status = 400, code = 'handoff/invalid' } = {}) {
    super(message)
    this.name = 'HandoffError'
    this.status = status
    this.code = code
  }
}

/** Localized generic titles that should not become a brief title. */
const GENERIC_TITLES = new Set([
  'new session', 'new conversation', 'untitled', 'session',
  '新会话', '新对话', '未命名', '会话',
])

/** Return a service or throw a clear domain failure. */
function requireService(ctx, name) {
  const service = ctx.get?.(name) ?? ctx[name]
  if (service === undefined || service === null) {
    throw new HandoffError(`the DSH ${name} service is unavailable`, {
      status: 503,
      code: 'handoff/service-unavailable',
    })
  }
  return service
}

/** Read one session title without failing the summary when the optional service is absent. */
async function readSourceTitle(ctx, sessionId) {
  try {
    const query = ctx.get?.('sessionQuery') ?? ctx.sessionQuery
    if (query?.readTitle === undefined) return ''
    const snapshot = await query.readTitle(sessionId)
    return typeof snapshot?.title === 'string' ? snapshot.title : ''
  } catch {
    return ''
  }
}

/** Select the model route the source conversation is using. */
function resolveRoute(ctx, agent) {
  const current = agent?.model?.current?.()
  if (typeof current?.provider === 'string' && current.provider !== ''
    && typeof current?.model === 'string' && current.model !== '') {
    return {
      provider: current.provider,
      model: current.model,
      ...(typeof current.reasoningEffort === 'string' && current.reasoningEffort !== ''
        ? { reasoningEffort: current.reasoningEffort }
        : {}),
    }
  }
  if (typeof agent?.options?.provider === 'string' && agent.options.provider !== ''
    && typeof agent?.options?.model === 'string' && agent.options.model !== '') {
    return {
      provider: agent.options.provider,
      model: agent.options.model,
      ...(typeof agent.options.reasoningEffort === 'string' && agent.options.reasoningEffort !== ''
        ? { reasoningEffort: agent.options.reasoningEffort }
        : {}),
    }
  }
  try {
    const fallback = ctx.get?.('agentDefaultModel')?.currentSelection?.()
    if (typeof fallback?.provider === 'string' && fallback.provider !== ''
      && typeof fallback?.model === 'string' && fallback.model !== '') {
      return {
        provider: fallback.provider,
        model: fallback.model,
        ...(typeof fallback.reasoningEffort === 'string' && fallback.reasoningEffort !== ''
          ? { reasoningEffort: fallback.reasoningEffort }
          : {}),
      }
    }
  } catch {
    // Optional service; absence becomes the explicit error below.
  }
  return undefined
}

/** Resolve the durable preset recorded on the surface or the live preset registry. */
function resolvePreset(ctx, session) {
  if (typeof session?.header?.agentPreset === 'string' && session.header.agentPreset !== '') {
    return session.header.agentPreset
  }
  try {
    return ctx.get?.('agentPresets')?.presetForSession?.(session) ?? ''
  } catch {
    return ''
  }
}

/**
 * Use the lightest reasoning effort the summary route advertises. A context brief does not
 * need the source conversation's high-effort reasoning, and reasoning tokens consume the
 * same output budget as visible text.
 */
async function resolveSummaryRoute(ctx, route, signal) {
  const base = { provider: route.provider, model: route.model }
  try {
    const llm = ctx.get?.('llm')
    if (typeof llm?.resolveModelInfo !== 'function') return base
    const info = await llm.resolveModelInfo(route.provider, route.model, signal)
    const efforts = Array.isArray(info?.reasoning?.efforts) ? info.reasoning.efforts : []
    if (efforts.length === 0) return base
    const preferred = efforts.find(effort => /^(off|none|minimal|low)$/iu.test(String(effort?.id)))
      ?? efforts[0]
    if (typeof preferred?.id === 'string' && preferred.id !== '') {
      return { ...base, reasoningEffort: preferred.id }
    }
  } catch {
    // Optional model metadata; the base route still works.
  }
  return base
}

/** Choose a usable title from the source title, an explicit request, or the first user message. */
function chooseTitle({ requested, sourceTitle, fallback }) {
  const explicit = typeof requested === 'string' ? requested.trim() : ''
  if (explicit !== '') return explicit.slice(0, 160)
  const durable = typeof sourceTitle === 'string' ? sourceTitle.trim() : ''
  if (durable !== '' && !GENERIC_TITLES.has(durable.toLowerCase())) return durable.slice(0, 160)
  const derived = typeof fallback === 'string' ? fallback.trim() : ''
  return (derived !== '' ? derived : 'Session context').slice(0, 160)
}

/** Host operations for creating, reading, editing, and deleting context briefs. */
export class HandoffService {
  constructor({ ctx, store, config = {} }) {
    this.ctx = ctx
    this.store = store
    this.config = config
    this.summaryConfig = resolveSummaryConfig(config)
  }

  /** List saved briefs. */
  async list() {
    return this.store.list()
  }

  /** Read one saved brief. */
  async get(id) {
    const brief = await this.store.get(id)
    if (brief === undefined) throw new HandoffError('context brief not found', { status: 404, code: 'handoff/not-found' })
    return brief
  }

  /** Execute the summary pipeline for one source session and persist the result. */
  async create({ sessionId, focus, title, sourceTitle, workspaceId, signal, onProgress } = {}) {
    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
      throw new HandoffError('sessionId is required')
    }
    const sessions = requireService(this.ctx, 'sessionController')
    const llm = requireService(this.ctx, 'llm')
    if (typeof llm.stream !== 'function') {
      throw new HandoffError('the LLM service cannot stream', { status: 503, code: 'handoff/llm-unavailable' })
    }
    const found = await sessions.resolveAgent(sessionId)
    if (found?.error !== undefined) {
      throw new HandoffError(found.error.message, {
        status: found.error.code === 'session/not-found' ? 404 : 409,
        code: found.error.code,
      })
    }
    const agent = found?.agent
    if (agent?.session === undefined) {
      throw new HandoffError('could not resolve the source conversation', {
        status: 500,
        code: 'handoff/session-unresolved',
      })
    }
    const route = resolveRoute(this.ctx, agent)
    if (route === undefined) {
      throw new HandoffError(
        'this conversation has no model route yet. Send one message first, or select a model for the session.',
        { status: 409, code: 'handoff/no-model' },
      )
    }
    let messages
    try {
      messages = agent.session.deriveMessages()
    } catch (error) {
      throw new HandoffError(`could not read the conversation surface: ${error instanceof Error ? error.message : String(error)}`, {
        status: 500,
        code: 'handoff/surface-unreadable',
      })
    }
    const durableTitle = await readSourceTitle(this.ctx, sessionId)
    const summaryRoute = await resolveSummaryRoute(this.ctx, route, signal)
    let result
    try {
      result = await summarizeConversation({
        llm,
        route: summaryRoute,
        messages,
        focus,
        config: this.summaryConfig,
        signal,
        onProgress: (progress) => {
          this.ctx.logger?.info?.(
            `context-handoff: ${progress.stage} ${String(progress.index)}/${String(progress.total)} for session ${sessionId}`,
          )
          onProgress?.(progress)
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.ctx.logger?.warn?.(`context-handoff: summary failed for session ${sessionId}: ${message}`)
      throw new HandoffError(message, { status: 422, code: 'handoff/summary-failed' })
    }
    const visibleMessages = messages.filter(message => message?.role === 'assistant' || message?.role === 'tool'
      || (message?.role === 'user'
        && (message?.source?.kind === 'user' || message?.source?.kind === 'goal' || message?.source?.kind === 'compact-checkpoint'))).length
    const now = Date.now()
    const requestTitle = typeof sourceTitle === 'string' ? sourceTitle.trim() : ''
    const storedSourceTitle = durableTitle.trim() !== '' && !GENERIC_TITLES.has(durableTitle.trim().toLowerCase())
      ? durableTitle.trim()
      : requestTitle !== '' && !GENERIC_TITLES.has(requestTitle.toLowerCase())
        ? requestTitle
        : result.suggestedTitle
    const preset = resolvePreset(this.ctx, agent.session)
    const record = {
      id: `ho_${now.toString(36)}_${randomUUID().slice(0, 8)}`,
      title: chooseTitle({ requested: title, sourceTitle: durableTitle, fallback: result.suggestedTitle }),
      summary: result.summary,
      sourceSessionId: sessionId,
      sourceTitle: storedSourceTitle.slice(0, 160),
      sourceCwd: typeof agent.session.header?.cwd === 'string' ? agent.session.header.cwd : '',
      sourceWorkspaceId: typeof workspaceId === 'string' ? workspaceId : '',
      sourceAgentPreset: preset,
      sourceModel: route,
      sourceSeq: Number(agent.session.seq ?? 0),
      messageCount: visibleMessages,
      focus: typeof focus === 'string' ? focus.trim().slice(0, this.summaryConfig.maxFocusChars) : '',
      createdAt: now,
      updatedAt: now,
    }
    // Title fallback should describe the conversation, not a generated heading.
    if (record.title === 'Session context') {
      const usable = durableTitle.trim()
      if (usable !== '' && !GENERIC_TITLES.has(usable.toLowerCase())) record.title = usable.slice(0, 160)
      else record.title = 'Session context'
    }
    await this.store.save(record)
    this.ctx.logger?.info?.(
      `context-handoff: created ${record.id} from session ${sessionId} (${String(result.userMessages)} user messages, ${String(result.inputChars)} chars)`,
    )
    return record
  }

  /** Update a saved brief's title or Markdown body. */
  async update({ id, title, summary } = {}) {
    if (typeof id !== 'string' || id.trim() === '') throw new HandoffError('id is required')
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      throw new HandoffError('title must not be empty')
    }
    if (summary !== undefined && (typeof summary !== 'string' || summary.trim() === '')) {
      throw new HandoffError('summary must not be empty')
    }
    if (title === undefined && summary === undefined) throw new HandoffError('nothing to update')
    const existing = await this.store.get(id)
    if (existing === undefined) throw new HandoffError('context brief not found', { status: 404, code: 'handoff/not-found' })
    return this.store.update(id, {
      ...(title === undefined ? {} : { title: title.trim() }),
      ...(summary === undefined ? {} : { summary: summary.trim() }),
    })
  }

  /** Delete a saved brief. */
  async remove(id) {
    if (typeof id !== 'string' || id.trim() === '') throw new HandoffError('id is required')
    const removed = await this.store.remove(id)
    if (!removed) throw new HandoffError('context brief not found', { status: 404, code: 'handoff/not-found' })
    return true
  }

  /** Health and inventory facts for the authenticated route. */
  async status() {
    const items = await this.store.list()
    return { briefs: items.length, model: this.ctx.get?.('agentDefaultModel')?.currentSelection?.()?.model ?? null }
  }
}
