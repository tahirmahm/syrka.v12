import { resolveDeepSeekModel } from '@/lib/deepseek'

/**
 * Deterministic checks over resolveDeepSeekModel (lib/deepseek.ts) — no
 * external network calls. Mirrors validate-seed-data.ts's plain
 * assertion-list pattern rather than adding a test framework.
 */
export function validateDeepSeekModelResolution(): string[] {
  const errors: string[] = []

  const unconfigured = resolveDeepSeekModel(undefined)
  if (unconfigured.model !== 'deepseek-v4-flash' || unconfigured.thinkingRequested) {
    errors.push('No configured model must resolve to deepseek-v4-flash with thinkingRequested=false')
  }

  const flash = resolveDeepSeekModel('deepseek-v4-flash')
  if (flash.model !== 'deepseek-v4-flash' || flash.thinkingRequested) {
    errors.push('"deepseek-v4-flash" must resolve to itself with thinkingRequested=false')
  }

  const pro = resolveDeepSeekModel('deepseek-v4-pro')
  if (pro.model !== 'deepseek-v4-pro' || pro.thinkingRequested) {
    errors.push('"deepseek-v4-pro" must resolve to itself with thinkingRequested=false')
  }

  const legacyChat = resolveDeepSeekModel('deepseek-chat')
  if (legacyChat.model !== 'deepseek-v4-flash' || legacyChat.thinkingRequested) {
    errors.push('Legacy alias "deepseek-chat" must normalise to deepseek-v4-flash with thinkingRequested=false')
  }

  const legacyReasoner = resolveDeepSeekModel('deepseek-reasoner')
  if (legacyReasoner.model !== 'deepseek-v4-flash' || !legacyReasoner.thinkingRequested) {
    errors.push('Legacy alias "deepseek-reasoner" must normalise to deepseek-v4-flash and preserve thinkingRequested=true')
  }

  try {
    resolveDeepSeekModel('gpt-4o')
    errors.push('An unsupported model identifier ("gpt-4o") must throw rather than resolve silently')
  } catch {
    // expected — an unsupported identifier must throw.
  }

  return errors
}
