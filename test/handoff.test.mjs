import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const summary = await import(new URL('../lib/summary.js', import.meta.url).href)
const prompts = await import(new URL('../lib/prompts.js', import.meta.url).href)
const storeMod = await import(new URL('../lib/store.js', import.meta.url).href)
const serviceMod = await import(new URL('../lib/service.js', import.meta.url).href)
const httpMod = await import(new URL('../lib/http.js', import.meta.url).href)

function message(role, text, sourceKind = 'user') {
  return {
    role,
    content: [{ type: 'text', text }],
    ...(role === 'user' ? { source: { kind: sourceKind } } : {}),
  }
}

function fakeLlm(answer) {
  let calls = 0
  return {
    get calls() { return calls },
    stream(options) {
      calls += 1
      const value = answer(calls, options)
      return (async function* () {
        yield { type: 'text-delta', index: 0, text: value }
        yield { type: 'finish', reason: { kind: 'stop' } }
      })()
    },
  }
}

const messages = [
  { role: 'system', content: [{ type: 'text', text: 'system prompt' }], source: { kind: 'system-prompt' } },
  message('user', 'Build a handoff plugin.'),
  message('user', 'AGENTS.md should be ignored.', 'context'),
  message('user', '<compacted-summary>Earlier work: chose the public route API.</compacted-summary>', 'compact-checkpoint'),
  message('assistant', 'I will inspect the plugin API.\n[tool call: read {"path":"docs"}]'),
  message('tool', 'result text'),
  message('user', 'Please keep the API decisions and remaining tests.'),
]

const continuation = prompts.buildContinuationMessage({
  sourceTitle: 'Test task', sourceCwd: 'C:/work', summary: '## Premise and purpose\nTest.',
})
assert.match(continuation, /Working directory: C:\/work/)
assert.match(continuation, /<context-brief>/)
assert.match(continuation, /## Premise and purpose/)
assert.match(continuation, /Do not resume, continue, or act on any previous task/)
assert.doesNotMatch(continuation, /Build a handoff plugin/)
const finalPrompt = prompts.buildFinalPrompt({ material: 'x', multiPass: false })
assert.match(finalPrompt, /## Premise and purpose/)
assert.doesNotMatch(finalPrompt, /## Next steps/)

const stripped = summary.normalizeBrief('## Premise and purpose\nA\n\n## Next steps\n- do work\n\n## Current state\nB')
assert.doesNotMatch(stripped, /Next steps/)
assert.match(stripped, /Current state/)

const extracted = summary.extractSegments(messages)
assert.equal(extracted.userMessages, 3)
assert.equal(extracted.segments.some(segment => segment.text.includes('AGENTS.md')), false)
assert.equal(extracted.segments.some(segment => segment.text.includes('compacted-summary')), true)
assert.equal(extracted.segments.some(segment => segment.role === 'tool'), true)

const single = fakeLlm(() => 'Here is the brief:\n\n## Premise and purpose\nUnderstand the setting.\n\n## Current state\nReady.')
const result = await summary.summarizeConversation({
  llm: single,
  route: { provider: 'p', model: 'm' },
  messages,
  focus: 'keep the tests',
  config: { singlePassChars: 50_000 },
})
assert.match(result.summary, /^## Premise and purpose/)
assert.doesNotMatch(result.summary, /Next steps/)
assert.equal(result.suggestedTitle, 'Build a handoff plugin.')
assert.equal(result.userMessages, 3)
assert.equal(single.calls, 1)

function truncatedLlm() {
  let calls = 0
  return {
    get calls() { return calls },
    stream() {
      calls += 1
      const first = calls === 1
      return (async function* () {
        yield { type: 'text-delta', index: 0, text: first ? '## Premise and purpose\nPartial brief' : ' continued.' }
        yield { type: 'finish', reason: { kind: first ? 'max-tokens' : 'stop' } }
      })()
    },
  }
}
const truncated = truncatedLlm()
const truncatedResult = await summary.summarizeConversation({
  llm: truncated,
  route: { provider: 'p', model: 'm' },
  messages,
  config: { singlePassChars: 50_000, maxContinuations: 1 },
})
assert.equal(truncated.calls, 2)
assert.match(truncatedResult.summary, /Partial brief\s+continued\./)

function emptyThenTextLlm() {
  let calls = 0
  return {
    get calls() { return calls },
    stream() {
      calls += 1
      const first = calls === 1
      return (async function* () {
        if (!first) yield { type: 'text-delta', index: 0, text: '## Premise and purpose\nRecovered brief.' }
        yield { type: 'finish', reason: { kind: 'stop' } }
      })()
    },
  }
}
const emptyThenText = emptyThenTextLlm()
const recoveredResult = await summary.summarizeConversation({
  llm: emptyThenText,
  route: { provider: 'p', model: 'm' },
  messages,
  config: { singlePassChars: 50_000 },
})
assert.equal(emptyThenText.calls, 2)
assert.match(recoveredResult.summary, /Recovered brief/)

function lengthSensitiveLlm() {
  let calls = 0
  return {
    get calls() { return calls },
    stream(options) {
      calls += 1
      const prompt = String(options.messages?.[0]?.content?.[0]?.text ?? '')
      const text = prompt.length > 25_000 ? '' : '## Premise and purpose\nSplit brief.'
      return (async function* () {
        if (text !== '') yield { type: 'text-delta', index: 0, text }
        yield { type: 'finish', reason: { kind: 'stop' } }
      })()
    },
  }
}
const splitMessages = []
for (let index = 0; index < 400; index += 1) {
  splitMessages.push(message(index % 2 === 0 ? 'user' : 'assistant', `Split slice ${index} ` + 'q'.repeat(220)))
}
const splitLlm = lengthSensitiveLlm()
const splitResult = await summary.summarizeConversation({
  llm: splitLlm,
  route: { provider: 'p', model: 'm' },
  messages: splitMessages,
  config: { singlePassChars: 60_000, chunkChars: 60_000, maxChunks: 40, maxInputChars: 2_400_000 },
})
assert.match(splitResult.summary, /Split brief/)
assert.ok(splitLlm.calls > 3)

const longMessages = []
for (let index = 0; index < 40; index += 1) {
  longMessages.push(message('user', `User message ${index} ` + 'x'.repeat(300)))
  longMessages.push(message('assistant', `Assistant message ${index} ` + 'y'.repeat(300)))
}
const multi = fakeLlm((call) => call <= 4 ? `notes from slice ${call}` : '## Mission\nMulti-pass brief.')
const multiResult = await summary.summarizeConversation({
  llm: multi,
  route: { provider: 'p', model: 'm' },
  messages: longMessages,
  config: { singlePassChars: 6_000, chunkChars: 6_000, maxChunks: 8, maxInputChars: 100_000 },
})
assert.match(multiResult.summary, /^## Mission/)
assert.ok(multiResult.chunkCount >= 2)
assert.ok(multi.calls >= 3)

const hugeMessages = []
for (let index = 0; index < 2400; index += 1) {
  hugeMessages.push(message(index % 2 === 0 ? 'user' : 'assistant', `Huge slice ${index} ` + 'z'.repeat(300)))
}
const huge = fakeLlm(() => '## Premise and purpose\nLarge brief.')
const hugeResult = await summary.summarizeConversation({
  llm: huge,
  route: { provider: 'p', model: 'm' },
  messages: hugeMessages,
  config: { singlePassChars: 60_000, chunkChars: 60_000, maxChunks: 40, maxInputChars: 2_400_000 },
})
assert.match(hugeResult.summary, /^## Premise and purpose/)
assert.ok(hugeResult.chunkCount > 2)
assert.ok(huge.calls > 2)

const dir = await mkdtemp(join(tmpdir(), 'dsh-handoff-test-'))
try {
  const store = new storeMod.HandoffStore({ directory: dir })
  const now = Date.now()
  await store.save({
    id: 'ho_test', title: 'Test', summary: '## Mission\nTest.', sourceSessionId: 's1',
    sourceTitle: 'Source', sourceCwd: 'C:/work', sourceWorkspaceId: '', sourceAgentPreset: '',
    sourceModel: { provider: 'p', model: 'm' }, sourceSeq: 3, messageCount: 2, focus: '',
    createdAt: now, updatedAt: now,
  })
  assert.equal((await store.list()).length, 1)
  const updated = await store.update('ho_test', { title: 'Updated' })
  assert.equal(updated.title, 'Updated')
  assert.equal((await store.get('ho_test')).title, 'Updated')
  await store.remove('ho_test')
  assert.equal((await store.list()).length, 0)
  const raw = await readFile(join(dir, 'briefs.json'), 'utf8')
  assert.match(raw, /"items"/)

  const fakeCtx = {
    logger: { info() {}, warn() {} },
    sessionQuery: { readTitle: async () => ({ title: 'Test task' }) },
    agentDefaultModel: { currentSelection: () => ({ provider: 'p', model: 'm' }) },
    sessionController: {
      resolveAgent: async () => ({
        agent: {
          model: { current: () => ({ provider: 'p', model: 'm' }) },
          options: { provider: 'p', model: 'm' },
          session: {
            seq: 42,
            header: { cwd: 'C:/work', agentPreset: 'standard' },
            deriveMessages: () => messages,
          },
        },
      }),
    },
    llm: fakeLlm(() => '## Premise and purpose\nService brief.\n\n## Current state\nReady.'),
    get(name) { return this[name] },
  }
  const service = new serviceMod.HandoffService({ ctx: fakeCtx, store })
  const brief = await service.create({ sessionId: 'session-1', focus: 'tests' })
  assert.equal(brief.sourceSessionId, 'session-1')
  assert.equal(brief.sourceTitle, 'Test task')
  assert.equal(brief.sourceCwd, 'C:/work')
  assert.equal(brief.sourceAgentPreset, 'standard')
  assert.equal(brief.messageCount, 5)
  assert.match(brief.summary, /^## Premise and purpose/)
  assert.equal((await service.list()).length, 1)
  assert.equal((await service.get(brief.id)).id, brief.id)
  const edited = await service.update({ id: brief.id, title: 'Edited', summary: '## Premise and purpose\nEdited.' })
  assert.equal(edited.title, 'Edited')
  await assert.rejects(
    service.update({ id: 'missing', title: 'Nope' }),
    error => error instanceof serviceMod.HandoffError && error.status === 404,
  )
  await service.remove(brief.id)
  assert.equal((await service.list()).length, 0)
} finally {
  await rm(dir, { recursive: true, force: true })
}

const routes = []
const fakeCtx = {
  logger: { warn() {} },
  connection: {
    fetch: {
      register(route) {
        assert.ok(route.path.startsWith('/api/'), `route path must include the /api channel prefix: ${route.path}`)
        routes.push(route)
        return async () => {}
      },
    },
  },
}
const fakeService = {
  status: async () => ({ briefs: 2 }),
  list: async () => [{ id: 'a' }],
  get: async id => { if (id === 'a') return { id: 'a' }; throw new serviceMod.HandoffError('not found', { status: 404, code: 'handoff/not-found' }) },
  create: async () => ({ id: 'created' }),
  update: async () => ({ id: 'a' }),
  remove: async () => true,
}
httpMod.registerHandoffRoutes(fakeCtx, fakeService)
assert.equal(routes.length, 6)
const listRoute = routes.find(route => route.path === '/api/handoff/list')
const listResponse = await listRoute.fetch(new Request('http://localhost/api/handoff/list', { method: 'POST', body: '{}' }))
assert.equal(listResponse.status, 200)
assert.deepEqual(await listResponse.json(), { ok: true, items: [{ id: 'a' }] })
const getRoute = routes.find(route => route.path === '/api/handoff/get')
const missingResponse = await getRoute.fetch(new Request('http://localhost/api/handoff/get', { method: 'POST', body: JSON.stringify({ id: 'missing' }) }))
assert.equal(missingResponse.status, 404)
assert.equal((await missingResponse.json()).error.code, 'handoff/not-found')

console.log('context handoff core tests passed')
