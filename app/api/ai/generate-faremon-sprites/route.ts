import { generateImage } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashPrompt, getCachedGeneratedAsset, saveGeneratedAsset } from '@/lib/faremon/ai-asset-cache'

const IMAGE_MODEL = process.env.IMAGE_MODEL || 'openai/gpt-image-1-mini'

const itemSchema = z.object({
  faremonId: z.string(),
  frontPrompt: z.string(),
  backPrompt: z.string(),
})

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(4),
})

function toDataUrl(base64: string, mediaType: string): string {
  return `data:${mediaType};base64,${base64}`
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const results: Array<{
    faremonId: string
    frontImageUrl: string | null
    backImageUrl: string | null
  }> = []

  for (const item of body.items) {
    let frontUrl: string | null = null
    let backUrl: string | null = null

    const fh = hashPrompt(item.frontPrompt)
    const bh = hashPrompt(item.backPrompt)

    const cachedF = getCachedGeneratedAsset(fh)
    const cachedB = getCachedGeneratedAsset(bh)

    try {
      if (cachedF) frontUrl = cachedF
      else {
        const f = await generateImage({
          model: IMAGE_MODEL,
          prompt: item.frontPrompt,
          n: 1,
        })
        const file = f.image
        frontUrl = toDataUrl(file.base64, file.mediaType)
        saveGeneratedAsset(fh, frontUrl)
      }
    } catch {
      frontUrl = null
    }

    try {
      if (cachedB) backUrl = cachedB
      else {
        const f = await generateImage({
          model: IMAGE_MODEL,
          prompt: item.backPrompt,
          n: 1,
        })
        const file = f.image
        backUrl = toDataUrl(file.base64, file.mediaType)
        saveGeneratedAsset(bh, backUrl)
      }
    } catch {
      backUrl = null
    }

    results.push({
      faremonId: item.faremonId,
      frontImageUrl: frontUrl,
      backImageUrl: backUrl,
    })
  }

  return NextResponse.json({ results })
}
