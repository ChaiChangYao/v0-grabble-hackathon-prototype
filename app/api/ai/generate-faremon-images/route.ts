import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buildBattleBackgroundPrompt,
  buildEnvironmentThemeFromTypes,
  buildFareMonBackSpritePrompt,
  buildFareMonFrontSpritePrompt,
  buildFareMonVisualIdentity,
} from '@/lib/faremon/faremon-ai-prompts'
import {
  getCachedGeneratedAsset,
  hashPrompt,
  saveGeneratedAsset,
} from '@/lib/faremon/ai-asset-cache'
import type { FareMon, FareMonGeneratedImages } from '@/lib/faremon/types'

const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gpt-image-1'

const faremonSchema = z.object({
  id: z.string(),
  name: z.string(),
  primaryType: z.string(),
  secondaryType: z.string().nullable().optional(),
  visualIdentity: z.string().nullable().optional(),
  frontImageUrl: z.string().nullable().optional(),
  backImageUrl: z.string().nullable().optional(),
  characterPromptFront: z.string().nullable().optional(),
  characterPromptBack: z.string().nullable().optional(),
}).passthrough()

const bodySchema = z.object({
  roomId: z.string(),
  battleId: z.string(),
  routeContext: z.object({
    city: z.string(),
    pickup: z.string(),
    destination: z.string(),
    weather: z.string(),
    timeOfDay: z.string(),
  }),
  player1ActiveFareMon: faremonSchema,
  player2ActiveFareMon: faremonSchema,
})

function assertConfigured() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'Image generation is not configured. Please provide the image generation API/model details before continuing. Required: server-side image generation provider, model id, and API key environment variable name.',
    )
  }
  if (!IMAGE_MODEL) {
    throw new Error(
      'Image generation is not configured. Please provide the image generation API/model details before continuing. Required: server-side image generation provider, model id, and API key environment variable name.',
    )
  }
}

function dataUrlFromBase64(base64: string): string {
  return `data:image/png;base64,${base64}`
}

async function generateCachedImage(openai: OpenAI, prompt: string): Promise<string> {
  const h = hashPrompt(prompt)
  const cached = getCachedGeneratedAsset(h)
  if (cached) return cached

  const res = await openai.images.generate({
    model: IMAGE_MODEL,
    prompt,
    n: 1,
    size: '1024x1024',
  })

  const b64 = res.data?.[0]?.b64_json
  if (!b64) {
    throw new Error('Image generation failed: provider did not return base64 image data')
  }

  const url = dataUrlFromBase64(b64)
  saveGeneratedAsset(h, url)
  return url
}

function imageResultForFareMon(fm: FareMon, frontImageUrl: string, backImageUrl: string) {
  const visualIdentity = buildFareMonVisualIdentity(fm)
  const frontPrompt = buildFareMonFrontSpritePrompt({ ...fm, visualIdentity })
  const backPrompt = buildFareMonBackSpritePrompt({ ...fm, visualIdentity })
  return {
    faremonId: fm.id,
    visualIdentity,
    frontPrompt,
    backPrompt,
    frontImageUrl,
    backImageUrl,
  }
}

export async function POST(req: NextRequest) {
  try {
    assertConfigured()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Image generation is not configured' },
      { status: 503 },
    )
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const player1 = body.player1ActiveFareMon as unknown as FareMon
  const player2 = body.player2ActiveFareMon as unknown as FareMon
  const env = buildEnvironmentThemeFromTypes(
    player1.primaryType,
    player2.primaryType,
    body.routeContext,
  )
  const backgroundPrompt = buildBattleBackgroundPrompt(env)

  const p1Visual = buildFareMonVisualIdentity(player1)
  const p2Visual = buildFareMonVisualIdentity(player2)
  const p1WithVisual = { ...player1, visualIdentity: p1Visual }
  const p2WithVisual = { ...player2, visualIdentity: p2Visual }
  const p1FrontPrompt = buildFareMonFrontSpritePrompt(p1WithVisual)
  const p1BackPrompt = buildFareMonBackSpritePrompt(p1WithVisual)
  const p2FrontPrompt = buildFareMonFrontSpritePrompt(p2WithVisual)
  const p2BackPrompt = buildFareMonBackSpritePrompt(p2WithVisual)

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const [
      backgroundImageUrl,
      p1FrontImageUrl,
      p1BackImageUrl,
      p2FrontImageUrl,
      p2BackImageUrl,
    ] = await Promise.all([
      generateCachedImage(openai, backgroundPrompt),
      generateCachedImage(openai, p1FrontPrompt),
      generateCachedImage(openai, p1BackPrompt),
      generateCachedImage(openai, p2FrontPrompt),
      generateCachedImage(openai, p2BackPrompt),
    ])

    const generatedImages: FareMonGeneratedImages = {
      backgroundImageUrl,
      backgroundPrompt,
      player1: imageResultForFareMon(p1WithVisual, p1FrontImageUrl, p1BackImageUrl),
      player2: imageResultForFareMon(p2WithVisual, p2FrontImageUrl, p2BackImageUrl),
    }

    return NextResponse.json({
      background: {
        prompt: backgroundPrompt,
        imageUrl: backgroundImageUrl,
      },
      faremonImages: {
        player1: generatedImages.player1,
        player2: generatedImages.player2,
      },
      generatedImages,
    })
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : 'Image generation failed. Check image model/API configuration.',
      },
      { status: 502 },
    )
  }
}
