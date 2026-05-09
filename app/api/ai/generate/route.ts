import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_AI_GATEWAY_MODEL } from '@/lib/ai-gateway'

const bodySchema = z.object({
  prompt: z.string().min(1),
  system: z.string().optional(),
  model: z.string().optional(),
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON or validation failed.' }, { status: 400 })
  }

  try {
    const result = await generateText({
      model: body.model ?? DEFAULT_AI_GATEWAY_MODEL,
      system: body.system,
      prompt: body.prompt,
    })
    return NextResponse.json({
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
