import OpenAI from 'openai'

export function createDeepSeekClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  })
}
