import { HandoffError } from './service.js'

const MAX_BODY_BYTES = 2 * 1024 * 1024

/** Build one JSON response with no caching. */
function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

/** Read and parse one small JSON body. */
async function readJson(request) {
  const text = await request.text()
  if (text.length === 0) return {}
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
    throw new HandoffError('request body is too large', { status: 413, code: 'handoff/body-too-large' })
  }
  try {
    const parsed = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new HandoffError('request body must be a JSON object')
    }
    return parsed
  } catch (error) {
    if (error instanceof HandoffError) throw error
    throw new HandoffError('request body is not valid JSON', { status: 400, code: 'handoff/bad-json' })
  }
}

/** Turn any thrown value into one structured route failure. */
function failure(ctx, error) {
  if (error instanceof HandoffError) {
    return json({ ok: false, error: { code: error.code, message: error.message } }, error.status)
  }
  const message = error instanceof Error ? error.message : String(error)
  ctx.logger?.warn?.(`context-handoff: route failure: ${message}`)
  return json({ ok: false, error: { code: 'handoff/internal', message } }, 500)
}

/** Register the authenticated HTTP surface used by the browser half. */
export function registerHandoffRoutes(ctx, service) {
  const route = (path, methods, handler) => ({
    path,
    methods,
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        return await handler(request)
      } catch (error) {
        return failure(ctx, error)
      }
    },
  })

  const routes = [
    route('/api/handoff/status', ['GET'], async () => {
      const status = await service.status()
      return json({ ok: true, ...status })
    }),
    route('/api/handoff/list', ['POST'], async () => {
      const items = await service.list()
      return json({ ok: true, items })
    }),
    route('/api/handoff/get', ['POST'], async (request) => {
      const body = await readJson(request)
      const brief = await service.get(body.id)
      return json({ ok: true, brief })
    }),
    route('/api/handoff/create', ['POST'], async (request) => {
      const body = await readJson(request)
      const brief = await service.create({
        sessionId: body.sessionId,
        focus: body.focus,
        title: body.title,
        sourceTitle: body.sourceTitle,
        workspaceId: body.workspaceId,
        signal: request.signal,
      })
      return json({ ok: true, brief })
    }),
    route('/api/handoff/update', ['POST'], async (request) => {
      const body = await readJson(request)
      const brief = await service.update({ id: body.id, title: body.title, summary: body.summary })
      return json({ ok: true, brief })
    }),
    route('/api/handoff/delete', ['POST'], async (request) => {
      const body = await readJson(request)
      await service.remove(body.id)
      return json({ ok: true })
    }),
  ]

  ctx.logger?.info?.('context-handoff: registering authenticated routes under /api/handoff')
  return routes.map(item => ctx.connection.fetch.register(item))
}
