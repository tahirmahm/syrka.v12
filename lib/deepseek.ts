import OpenAI from 'openai'

export function createDeepSeekClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
  })
}

/**
 * DeepSeek's legacy aliases `deepseek-chat` and `deepseek-reasoner` — the
 * exact identifiers every DeepSeek call in this repo used before this
 * migration — were retired 2026-07-24 15:59 UTC. Both currently route to
 * deepseek-v4-flash (non-thinking/thinking mode respectively) as a
 * migration bridge, per DeepSeek's own changelog, but that bridge is
 * transitional, not a permanent alias — every call site should request a
 * V4 model by name directly.
 */
export type DeepSeekModel = 'deepseek-v4-flash' | 'deepseek-v4-pro'

const SUPPORTED_MODELS: readonly DeepSeekModel[] = ['deepseek-v4-flash', 'deepseek-v4-pro']

const LEGACY_ALIASES: Record<string, DeepSeekModel> = {
  'deepseek-chat': 'deepseek-v4-flash',
  'deepseek-reasoner': 'deepseek-v4-flash',
}

export interface ResolvedDeepSeekModel {
  model: DeepSeekModel
  /**
   * True only when the caller's original request was the retired
   * `deepseek-reasoner` alias, which implied reasoning/thinking mode by
   * model choice. On V4, thinking mode is a request-shape option rather
   * than a separate model name — this flag tells the caller "the old
   * behavior you asked for was reasoning mode", it does not itself set
   * any request field. No caller in this codebase currently requests
   * `deepseek-reasoner` (verified by repo-wide search), so this is
   * forward-looking, not an active behavior change. The exact V4 request
   * parameter for thinking mode could not be confirmed from this
   * environment (api-docs.deepseek.com is blocked by this session's
   * egress policy) — confirm it against live DeepSeek docs before any
   * caller actually sets it.
   */
  thinkingRequested: boolean
}

/**
 * The single place every DeepSeek call in this app resolves its model
 * name — never hardcode "deepseek-chat", "deepseek-reasoner", or any
 * other identifier at a call site again. Accepts the two current V4
 * models directly, normalises a retired legacy alias (with a one-time
 * dev-only console warning so a stale env var doesn't fail silently),
 * defaults to deepseek-v4-flash when nothing is configured, and throws on
 * an unrecognised identifier rather than forwarding it to the provider
 * unchecked. Never touches API keys.
 */
export function resolveDeepSeekModel(requested?: string): ResolvedDeepSeekModel {
  const fallback: DeepSeekModel = 'deepseek-v4-flash'
  if (!requested) return { model: fallback, thinkingRequested: false }

  if ((SUPPORTED_MODELS as readonly string[]).includes(requested)) {
    return { model: requested as DeepSeekModel, thinkingRequested: false }
  }

  const legacyReplacement = LEGACY_ALIASES[requested]
  if (legacyReplacement) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[deepseek] Model "${requested}" was retired 2026-07-24 and has been normalised to "${legacyReplacement}" for this call. Update the caller (or its configuring env var) to request "${legacyReplacement}" or "deepseek-v4-pro" directly.`
      )
    }
    return { model: legacyReplacement, thinkingRequested: requested === 'deepseek-reasoner' }
  }

  throw new Error(`Unsupported DeepSeek model identifier: "${requested}". Use "deepseek-v4-flash" or "deepseek-v4-pro".`)
}
