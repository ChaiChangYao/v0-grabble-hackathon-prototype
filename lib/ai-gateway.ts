import type { ModelMessage } from 'ai'

/** Default model when the client does not pass `model` (Vercel AI Gateway id: `provider/model`). */
export const DEFAULT_AI_GATEWAY_MODEL = 'openai/gpt-5.4'

/** Map a simple chat payload to AI SDK `ModelMessage`s for `generateText` / `streamText`. */
export function simpleMessagesToModelMessages(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): ModelMessage[] {
  return messages.map((m) => {
    if (m.role === 'system') {
      return { role: 'system', content: m.content }
    }
    if (m.role === 'user') {
      return { role: 'user', content: [{ type: 'text', text: m.content }] }
    }
    return { role: 'assistant', content: [{ type: 'text', text: m.content }] }
  })
}
