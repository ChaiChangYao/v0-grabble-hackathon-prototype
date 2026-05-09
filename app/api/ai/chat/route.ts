import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_AI_GATEWAY_MODEL, simpleMessagesToModelMessages } from '@/lib/ai-gateway'

const bodySchema = z.object({
  model: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      }),
    )
    .min(1),
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON or validation failed.' }, { status: 400 })
  }

  try {
    const result = streamText({
      model: body.model ?? DEFAULT_AI_GATEWAY_MODEL,
      messages: simpleMessagesToModelMessages(body.messages),
    })
    return result.toTextStreamResponse()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Streaming failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
