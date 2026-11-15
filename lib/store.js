import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const MAX_TITLE = 160
const MAX_SUMMARY = 200_000
const MAX_FOCUS = 8_000

/** Bound one string without trusting caller input. */
export function clip(value, max) {
  if (typeof value !== 'string') return ''
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

/** Normalize one stored record; unknown fields are discarded. */
function normalizeRecord(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return undefined
  const record = input
  if (typeof record.id !== 'string' || record.id === '') return undefined
  if (typeof record.summary !== 'string' || record.summary.trim() === '') return undefined
  const model = record.sourceModel
  const sourceModel = model !== null && typeof model === 'object'
    && typeof model.provider === 'string' && typeof model.model === 'string'
    ? {
      provider: model.provider,
      model: model.model,
      ...(typeof model.reasoningEffort === 'string' && model.reasoningEffort !== ''
        ? { reasoningEffort: model.reasoningEffort }
        : {}),
    }
    : undefined
  return {
    id: record.id,
    title: clip(record.title, MAX_TITLE) || 'Session context',
    summary: clip(record.summary, MAX_SUMMARY),
    sourceSessionId: clip(record.sourceSessionId, 200),
    sourceTitle: clip(record.sourceTitle, MAX_TITLE),
    sourceCwd: clip(record.sourceCwd, 2_000),
    sourceWorkspaceId: clip(record.sourceWorkspaceId, 200),
    sourceAgentPreset: clip(record.sourceAgentPreset, 200),
    ...(sourceModel === undefined ? {} : { sourceModel }),
    sourceSeq: Number.isSafeInteger(record.sourceSeq) && record.sourceSeq >= 0 ? record.sourceSeq : 0,
    messageCount: Number.isSafeInteger(record.messageCount) && record.messageCount >= 0 ? record.messageCount : 0,
    focus: clip(record.focus, MAX_FOCUS),
    createdAt: Number.isSafeInteger(record.createdAt) && record.createdAt > 0 ? record.createdAt : Date.now(),
    updatedAt: Number.isSafeInteger(record.updatedAt) && record.updatedAt > 0 ? record.updatedAt : Date.now(),
  }
}

/** Durable JSON store for context briefs. Writes are serialized and atomic. */
export class HandoffStore {
  constructor({ directory }) {
    this.directory = directory
    this.file = join(directory, 'briefs.json')
    this.cache = undefined
    this.queue = Promise.resolve()
  }

  /** Wait for pending writes and return a detached list, newest first. */
  async list() {
    await this.queue
    const data = await this.read()
    return structuredClone(data.items).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /** Return one record or undefined. */
  async get(id) {
    const items = await this.list()
    return items.find(item => item.id === id)
  }

  /** Insert or replace one record. */
  async save(record) {
    const normalized = normalizeRecord(record)
    if (normalized === undefined) throw new Error('handoff record is invalid')
    return this.mutate((data) => {
      const index = data.items.findIndex(item => item.id === normalized.id)
      if (index === -1) data.items.unshift(normalized)
      else data.items[index] = normalized
      return normalized
    })
  }

  /** Apply a partial update to one existing record. */
  async update(id, patch) {
    return this.mutate((data) => {
      const index = data.items.findIndex(item => item.id === id)
      if (index === -1) throw new Error('context brief not found')
      const current = data.items[index]
      const next = normalizeRecord({
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: Date.now(),
      })
      if (next === undefined) throw new Error('handoff record is invalid')
      data.items[index] = next
      return next
    })
  }

  /** Remove one record and report whether it existed. */
  async remove(id) {
    return this.mutate((data) => {
      const before = data.items.length
      data.items = data.items.filter(item => item.id !== id)
      return data.items.length !== before
    })
  }

  /** Serialize one mutation and atomically persist the resulting document. */
  async mutate(operation) {
    const task = this.queue.then(async () => {
      const data = await this.read()
      const result = await operation(data)
      await this.write(data)
      this.cache = data
      return result
    })
    this.queue = task.then(() => undefined, () => undefined)
    return task
  }

  /** Read the current document, falling back to an empty one. */
  async read() {
    if (this.cache !== undefined) return this.cache
    let data = { version: 1, items: [] }
    try {
      const text = await readFile(this.file, 'utf8')
      const parsed = JSON.parse(text)
      if (parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.items)) {
        data = {
          version: 1,
          items: parsed.items.map(normalizeRecord).filter(item => item !== undefined),
        }
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    this.cache = data
    return data
  }

  /** Persist one complete document through a same-directory temporary file. */
  async write(data) {
    await mkdir(this.directory, { recursive: true })
    // Keep the previous document recoverable if a stale UI or a crash lands
    // between a read and the next write.
    try {
      await copyFile(this.file, `${this.file}.bak`)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    const temporary = `${this.file}.${process.pid}.${Date.now()}.tmp`
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    await rename(temporary, this.file)
  }
}
