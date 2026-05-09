import { generateImage } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { buildBattleBackgroundPrompt } from '@/lib/faremon/faremon-ai-prompts'
import { hashPrompt, getCachedGeneratedAsset, saveGeneratedAsset } from '@/lib/faremon/ai-asset-cache'

const IMAGE_MODEL = process.env.IMAGE_MODEL || 'openai/gpt-image-1-mini'

const bodySchema = z.object({
  environmentTheme: z.string(),
  platformShape: z.string(),
  foregroundPlatform: z.string(),
  platformSurfaceDetail: z.string(),
  platformEdgeDetail: z.string(),
  backgroundEnvironmentTheme: z.string(),
  platformColors: z.string(),
  backgroundColors: z.string(),
})

function toDataUrl(base64: string, mediaType: string): string {
  return `data:${mediaType};base64,${base64}`
}

export async function POST(req: NextRequest) {
  let raw: z.infer<typeof bodySchema>
  try {
    raw = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const prompt = buildBattleBackgroundPrompt(raw)
  const h = hashPrompt(prompt)
  const cached = getCachedGeneratedAsset(h)
  if (cached) {
    return NextResponse.json({ imageUrl: cached, prompt, cached: true })
  }

  try {
    const res = await generateImage({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
    })
    const file = res.image
    const url = toDataUrl(file.base64, file.mediaType)
    saveGeneratedAsset(h, url)
    return NextResponse.json({ imageUrl: url, prompt, cached: false })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Image generation failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
