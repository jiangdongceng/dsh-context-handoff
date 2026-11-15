import { clip } from './store.js'
import {
  SEGMENT_SYSTEM_PROMPT,
  SUMMARIZER_SYSTEM_PROMPT,
  buildFinalPrompt,
  buildSegmentPrompt,
} from './prompts.js'

export const SUMMARY_DEFAULTS = Object.freeze({
  singlePassChars: 60_000,
  chunkChars: 60_000,
  maxChunks: 40,
  maxInputChars: 2_400_000,
  maxOutputTokens: 8_000,
  segmentOutputTokens: 8_000,
  maxContinuations: 2,
  timeoutMs: 180_000,
  maxMessageChars: 14_000,
  maxToolResultChars: 2_000,
  maxToolArgsChars: 700,
  maxFocusChars: 8_000,
})

/** Merge caller config over the documented defaults. */
export function resolveSummaryConfig(config = {}) {
  const read = (key, minimum) => {
    const value = config[key]
    return Number.isSafeInteger(value) && value >= minimum ? value : SUMMARY_DEFAULTS[key]
  }
  return {
    singlePassChars: read('singlePassChars', 5_000),
    chunkChars: read('chunkChars', 5_000),
    maxChunks: read('maxChunks', 1),
    maxInputChars: read('maxInputChars', 10_000),
    maxOutputTokens: read('maxOutputTokens', 256),
    segmentOutputTokens: read('segmentOutputTokens', 256),
    maxContinuations: read('maxContinuations', 0),
    timeoutMs: read('timeoutMs', 10_000),
    maxMessageChars: read('maxMessageChars', 500),
    maxToolResultChars: read('maxToolResultChars', 200),
    maxToolArgsChars: read('maxToolArgsChars', 100),
    maxFocusChars: read('maxFocusChars', 500),
  }
}

/** Render one content block list to plain text for summarization. */
function contentText(content, cfg) {
  const parts = []
  for (const block of content) {
    if (block === null || typeof block !== 'object') continue
    switch (block.type) {
      case 'text':
        if (typeof block.text === 'string') parts.push(block.text)
        break
      case 'image':
        parts.push(`[image${block.attachment?.name ? `: ${block.attachment.name}` : ''}]`)
        break
      case 'file': {
        const name = block.attachment?.name
        const size = block.attachment?.byteLength
        parts.push(`[file${name ? `: ${name}` : ''}${Number.isSafeInteger(size) ? `, ${size} bytes` : ''}]`)
        break
      }
      case 'tool-call':
        parts.push(`[tool call: ${block.name} ${clip(block.arguments, cfg.maxToolArgsChars)}]`)
        break
      default:
        break
    }
  }
  return parts.join('\n').trim()
}

/** Whether a user message is real human input, a goal continuation, or a compaction checkpoint. */
function userMessageKind(message) {
  const kind = message?.source?.kind
  return kind === 'user' || kind === 'goal' || kind === 'compact-checkpoint'
}

/** Extract the conversation surface into compact, role-labelled segments. */
export function extractSegments(messages, config = {}) {
  const cfg = resolveSummaryConfig(config)
  const segments = []
  let userMessages = 0
  for (const message of messages) {
    if (message === null || typeof message !== 'object') continue
    if (message.role === 'system' || message.role === 'developer') continue
    if (message.role === 'user') {
      if (!userMessageKind(message)) continue
      const text = contentText(message.content, cfg)
      if (text === '') continue
      userMessages += 1
      segments.push({
        role: message.source?.kind === 'compact-checkpoint' ? 'checkpoint' : 'user',
        text: clip(text, cfg.maxMessageChars),
      })
      continue
    }
    if (message.role === 'assistant') {
      const text = contentText(message.content, cfg)
      if (text === '') continue
      segments.push({ role: 'assistant', text: clip(text, cfg.maxMessageChars) })
      continue
    }
    if (message.role === 'tool') {
      const text = contentText(message.content, cfg)
      if (text === '') continue
      segments.push({ role: 'tool', text: clip(text, cfg.maxToolResultChars) })
    }
  }
  return { segments, userMessages }
}

/** Format one segment with a stable, compact label. */
function formatSegment(segment) {
  const label = segment.role === 'user'
    ? 'USER'
    : segment.role === 'assistant'
      ? 'ASSISTANT'
      : segment.role === 'checkpoint' ? 'EARLIER COMPACTION CHECKPOINT' : 'TOOL RESULT'
  return `### ${label}\n${segment.text}`
}

/** Group a transcript into chunks at message boundaries. */
export function chunkTranscript(segments, cfg) {
  const chunks = []
  let current = ''
  for (const segment of segments) {
    const block = formatSegment(segment)
    if (block.length > cfg.chunkChars) {
      if (current !== '') {
        chunks.push(current)
        current = ''
      }
      chunks.push(clip(block, cfg.chunkChars))
      continue
    }
    if (current !== '' && current.length + block.length + 2 > cfg.chunkChars) {
      chunks.push(current)
      current = ''
    }
    current = current === '' ? block : `${current}\n\n${block}`
  }
  if (current !== '') chunks.push(current)
  return chunks
}

/** Remove a wrapping code fence and any conversational preamble. */
export function normalizeBrief(text) {
  let value = String(text).trim()
  value = value.replace(/^```(?:markdown|md)?\s*\r?\n/iu, '').replace(/\r?\n```\s*$/u, '').trim()
  const heading = value.indexOf('## ')
  if (heading > 0) value = value.slice(heading).trim()
  // The brief is background, never a task plan. Drop a stray action section if
  // the model adds one despite the prompt.
  const kept = []
  let skipSection = false
  for (const line of value.split(/\r?\n/u)) {
    const heading = /^##[ \t]+(.+)$/u.exec(line)
    if (heading !== null) {
      const title = heading[1].trim().toLowerCase()
      skipSection = /^(?:next steps?|待办(?:事项)?|下一步|后续步骤)$/u.test(title)
    }
    if (!skipSection) kept.push(line)
  }
  return kept.join('\n').trim()
}

/** Build a compact fallback title from the first human message. */
export function fallbackTitle(segments) {
  const first = segments.find(segment => segment.role === 'user')
  if (first === undefined) return 'Session context'
  const line = first.text.split(/\r?\n/u).map(part => part.trim()).find(part => part !== '')
  return clip((line ?? 'Session context').replace(/^#+\s*/u, ''), 80)
}

/** One continuation request appended after a model output hits its token ceiling. */
const CONTINUE_PROMPT = 'Your previous answer was cut off by the output limit. Continue exactly where it stopped. Do not repeat any heading, bullet, sentence, or code already written. Output only the continuation.'

/** Wait for one model answer while honoring caller cancellation and a local timeout. */
async function callModel({ llm, route, system, prompt, messages, maxTokens, timeoutMs, signal }) {
  const controller = new AbortController()
  const onAbort = () => controller.abort(signal?.reason)
  if (signal?.aborted === true) throw signal.reason ?? new Error('handoff summary cancelled')
  signal?.addEventListener('abort', onAbort, { once: true })
  const timer = setTimeout(() => {
    controller.abort(new Error(`summary timed out after ${Math.round(timeoutMs / 1000)}s`))
  }, timeoutMs)
  let text = ''
  const blockFallback = []
  let failure
  let finishKind
  try {
    const stream = llm.stream({
      provider: route.provider,
      model: route.model,
      ...(route.reasoningEffort === undefined ? {} : { reasoningEffort: route.reasoningEffort }),
      system,
      messages: messages ?? [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      maxTokens,
      signal: controller.signal,
    })
    for await (const chunk of stream) {
      if (chunk === null || typeof chunk !== 'object') continue
      if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
      else if (chunk.type === 'block-end' && chunk.block?.type === 'text' && typeof chunk.block.text === 'string') {
        blockFallback.push(chunk.block.text)
      } else if (chunk.type === 'finish') {
        finishKind = chunk.reason?.kind
        if (chunk.reason?.kind === 'error') failure = chunk.reason.failure
        else if (chunk.reason?.kind === 'aborted') failure = chunk.reason.failure
        break
      }
    }
  } catch (error) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason
      throw reason instanceof Error ? reason : new Error('summary cancelled')
    }
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
  if (failure !== undefined) {
    throw new Error(`summary model failed: ${typeof failure.message === 'string' ? failure.message : 'unknown model failure'}`)
  }
  const answer = text.trim() === '' ? blockFallback.join('').trim() : text.trim()
  return { text: answer, truncated: finishKind === 'max-tokens' }
}

/** Ask the model to finish a final brief that hit its output ceiling. */
async function finalSummary({ llm, route, system, prompt, recoveryPrompt, shortRecoveryPrompt, maxTokens, timeoutMs, maxContinuations, signal }) {
  let result = await callModel({ llm, route, system, prompt, maxTokens, timeoutMs, signal })
  if (result.text === '') {
    // Reasoning-only or empty first answer: try once with a smaller material window.
    result = await callModel({
      llm,
      route,
      system,
      prompt: recoveryPrompt ?? prompt,
      maxTokens,
      timeoutMs,
      signal,
    })
  }
  if (result.text === '' && shortRecoveryPrompt !== undefined) {
    // A final, very small window usually fits even a small-context route.
    result = await callModel({
      llm,
      route,
      system,
      prompt: shortRecoveryPrompt,
      maxTokens,
      timeoutMs,
      signal,
    })
  }
  if (result.text === '') {
    throw new Error(
      'the summary model returned no visible text (it may have spent the output budget on reasoning). Try another model or a lower reasoning setting, then retry.',
    )
  }
  let text = result.text
  let continuations = 0
  while (result.truncated && continuations < maxContinuations) {
    continuations += 1
    try {
      result = await callModel({
        llm,
        route,
        system,
        messages: [
          { role: 'user', content: [{ type: 'text', text: prompt }] },
          {
            role: 'assistant',
            id: `handoff-partial-${String(continuations)}`,
            content: [{ type: 'text', text }],
            source: { kind: 'model', provider: route.provider, model: route.model },
          },
          { role: 'user', content: [{ type: 'text', text: CONTINUE_PROMPT }] },
        ],
        maxTokens,
        timeoutMs,
        signal,
      })
      if (result.text === '') break
      text += `\n${result.text}`
    } catch (error) {
      if (signal?.aborted === true) throw error
      // Keep the useful partial brief when the provider cannot continue.
      break
    }
  }
  return text
}

/**
 * Summarize one conversation surface into a structured context brief.
 * @returns {{summary: string, inputChars: number, chunkCount: number, userMessages: number}}
 */
export async function summarizeConversation({
  llm,
  route,
  messages,
  focus,
  config = {},
  signal,
  onProgress,
}) {
  const cfg = resolveSummaryConfig(config)
  const { segments, userMessages } = extractSegments(messages, cfg)
  if (segments.length === 0) throw new Error('this conversation has no messages to summarize yet')
  if (userMessages === 0) throw new Error('this conversation has no user messages to summarize yet')
  const transcript = segments.map(formatSegment).join('\n\n')
  if (transcript.length > cfg.maxInputChars) {
    throw new Error(
      `this conversation is too large to summarize (${transcript.length} characters; safety limit ${cfg.maxInputChars}). Start a handoff from a shorter conversation or raise the plugin maxInputChars limit.`,
    )
  }
  const clippedFocus = clip(typeof focus === 'string' ? focus.trim() : '', cfg.maxFocusChars)
  let summary
  let chunkCount = 1
  if (transcript.length <= cfg.singlePassChars) {
    onProgress?.({ stage: 'final', index: 1, total: 1 })
    summary = await finalSummary({
      llm,
      route,
      system: SUMMARIZER_SYSTEM_PROMPT,
      prompt: buildFinalPrompt({ material: transcript, focus: clippedFocus, multiPass: false }),
      recoveryPrompt: buildFinalPrompt({ material: clip(transcript, 30_000), focus: clippedFocus, multiPass: false }),
      shortRecoveryPrompt: buildFinalPrompt({ material: clip(transcript, 8_000), focus: clippedFocus, multiPass: false }),
      maxTokens: cfg.maxOutputTokens,
      maxContinuations: cfg.maxContinuations,
      timeoutMs: cfg.timeoutMs,
      signal,
    })
  } else {
    const chunks = chunkTranscript(segments, cfg)
    if (chunks.length > cfg.maxChunks) {
      throw new Error(
        `this conversation needs ${chunks.length} summary slices but the limit is ${cfg.maxChunks}. Compact the conversation first or raise the plugin limit.`,
      )
    }
    chunkCount = chunks.length + 1
    const summarizeSlice = async ({ text, previousNotes, index, total, depth }) => {
      const prompt = buildSegmentPrompt({
        segment: text,
        previousNotes: clip(previousNotes, 24_000),
        index,
        total,
        focus: clippedFocus,
      })
      let answer = await callModel({
        llm,
        route,
        system: SEGMENT_SYSTEM_PROMPT,
        prompt,
        maxTokens: cfg.segmentOutputTokens,
        timeoutMs: cfg.timeoutMs,
        signal,
      })
      if (answer.text === '') {
        // Reasoning-heavy routes may spend the entire segment budget before text.
        answer = await callModel({
          llm,
          route,
          system: SEGMENT_SYSTEM_PROMPT,
          prompt,
          maxTokens: cfg.maxOutputTokens,
          timeoutMs: cfg.timeoutMs,
          signal,
        })
      }
      if (answer.text !== '') return answer.text
      // An empty answer can mean the slice does not fit the route's real context.
      // Split it and summarize both halves instead of losing the whole slice.
      if (depth >= 4 || text.length < 15_000) return ''
      const midpoint = Math.floor(text.length / 2)
      const boundary = text.lastIndexOf('\n\n', midpoint)
      const cut = boundary > Math.floor(text.length * 0.25) ? boundary : midpoint
      const left = await summarizeSlice({
        text: text.slice(0, cut), previousNotes, index, total, depth: depth + 1,
      })
      const right = await summarizeSlice({
        text: text.slice(cut),
        previousNotes: left === '' ? previousNotes : `${previousNotes}\n\n${left}`,
        index,
        total,
        depth: depth + 1,
      })
      return [left, right].filter(part => part !== '').join('\n\n')
    }

    let notes = ''
    for (let index = 0; index < chunks.length; index += 1) {
      onProgress?.({ stage: 'segment', index: index + 1, total: chunks.length + 1 })
      const answer = await summarizeSlice({
        text: chunks[index],
        previousNotes: notes,
        index: index + 1,
        total: chunks.length,
        depth: 0,
      })
      if (answer === '') continue
      notes = notes === '' ? answer : `${notes}\n\n${answer}`
    }
    if (notes.trim() === '') {
      throw new Error(
        'the summary model returned no visible text for any conversation slice (it may have spent the output budget on reasoning). Try another model or a lower reasoning setting, then retry.',
      )
    }
    onProgress?.({ stage: 'final', index: chunks.length + 1, total: chunks.length + 1 })
    const finalMaterial = clip(notes, Math.min(cfg.maxInputChars, 120_000))
    summary = await finalSummary({
      llm,
      route,
      system: SUMMARIZER_SYSTEM_PROMPT,
      prompt: buildFinalPrompt({
        material: finalMaterial,
        focus: clippedFocus,
        multiPass: true,
      }),
      recoveryPrompt: buildFinalPrompt({
        material: clip(finalMaterial, 30_000),
        focus: clippedFocus,
        multiPass: true,
      }),
      shortRecoveryPrompt: buildFinalPrompt({
        material: clip(finalMaterial, 8_000),
        focus: clippedFocus,
        multiPass: true,
      }),
      maxTokens: cfg.maxOutputTokens,
      maxContinuations: cfg.maxContinuations,
      timeoutMs: cfg.timeoutMs,
      signal,
    })
  }
  const brief = normalizeBrief(summary)
  if (brief === '') throw new Error('summary model returned no usable brief')
  return {
    summary: brief,
    suggestedTitle: fallbackTitle(segments),
    inputChars: transcript.length,
    chunkCount,
    userMessages,
  }
}
