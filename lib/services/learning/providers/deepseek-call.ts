import { createDeepSeekClient, resolveDeepSeekModel, type DeepSeekModel } from '@/lib/deepseek'
import { LearningProviderError } from './types'

export interface DeepSeekCallConfig {
  model: DeepSeekModel
  temperature: number
  maxOutputTokens: number
  timeoutMs: number
}

/**
 * The one place every LEARN-002 DeepSeek call goes through — mirrors
 * lib/services/odyssey/deepseek-provider.ts's callDeepSeek() exactly
 * (same client factory, same AbortController timeout, same JSON-object
 * response format, same error taxonomy) so this pass introduces no new
 * call pattern. Never called from a client component.
 */
export async function callLearningDeepSeek(config: DeepSeekCallConfig, systemPrompt: string, userPrompt: string): Promise<unknown> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new LearningProviderError('unavailable', 'DeepSeek is not configured on this server.')
  }

  const { model } = resolveDeepSeekModel(config.model)
  const client = createDeepSeekClient()
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const completion = await client.chat.completions.create(
      {
        model,
        temperature: config.temperature,
        max_tokens: config.maxOutputTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      { signal: controller.signal }
    )

    const content = completion.choices[0]?.message?.content
    if (!content) throw new LearningProviderError('malformed_response', 'Provider returned an empty response.')

    const cleaned = content.replace(/```json|```/g, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      throw new LearningProviderError('malformed_response', 'Provider response could not be parsed as JSON.')
    }
  } catch (error) {
    if (error instanceof LearningProviderError) throw error
    if (error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError') {
      throw new LearningProviderError('timeout', 'Provider request timed out.')
    }
    const status = (error as { status?: number } | undefined)?.status
    if (status === 429) throw new LearningProviderError('rate_limited', 'Provider rate limit reached.')
    if (typeof status === 'number' && status >= 500) throw new LearningProviderError('unavailable', 'Provider is currently unavailable.')
    throw new LearningProviderError('unknown', 'Provider request failed.')
  } finally {
    clearTimeout(timeoutHandle)
  }
}

/** Token/time budget per operation kind — deliberately small since every prompt is a bounded brief, never a full curriculum dump. */
export const LEARNING_PROVIDER_CONFIG: Record<'pro' | 'flash', DeepSeekCallConfig> = {
  pro: { model: 'deepseek-v4-pro', temperature: 0.3, maxOutputTokens: 900, timeoutMs: 12000 },
  flash: { model: 'deepseek-v4-flash', temperature: 0.4, maxOutputTokens: 500, timeoutMs: 8000 },
}
