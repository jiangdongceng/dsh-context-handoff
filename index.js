import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { HandoffStore } from './lib/store.js'
import { HandoffService } from './lib/service.js'
import { registerHandoffRoutes } from './lib/http.js'

/** A dedicated folder used when it already exists on this machine. */
export const PREFERRED_DATA_DIR = 'D:\\dsh\\context-handoff'

/** Resolve the DSH home for a fallback data folder. */
function resolveDshHome(env = process.env) {
  if (typeof env.DSH_HOME === 'string' && env.DSH_HOME.trim() !== '') return env.DSH_HOME
  if (typeof env.DSH_PROFILE_DIR === 'string' && env.DSH_PROFILE_DIR.trim() !== '') {
    return dirname(dirname(env.DSH_PROFILE_DIR))
  }
  return join(homedir(), '.dsh')
}

/** Resolve the directory holding context briefs. */
export function resolveDataDir(config = {}, env = process.env) {
  if (typeof config.dataDir === 'string' && config.dataDir.trim() !== '') return config.dataDir
  if (typeof env.DSH_CONTEXT_HANDOFF_DIR === 'string' && env.DSH_CONTEXT_HANDOFF_DIR.trim() !== '') {
    return env.DSH_CONTEXT_HANDOFF_DIR
  }
  if (existsSync(PREFERRED_DATA_DIR)) return PREFERRED_DATA_DIR
  return join(resolveDshHome(env), 'context-handoff')
}

/** Apply the Host half: one store, one service, authenticated routes. */
export function apply(ctx, config = {}) {
  const store = new HandoffStore({ directory: resolveDataDir(config) })
  const service = new HandoffService({ ctx, store, config })

  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      const disposers = registerHandoffRoutes(connectionCtx, service)
      return async () => {
        for (const dispose of disposers.reverse()) await dispose()
      }
    }, 'context-handoff: authenticated routes')
  })

  ctx.logger.info('context-handoff: ready')
}
