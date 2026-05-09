import { generateObject } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { buildFareMonTeamGenerationPrompt } from '@/lib/faremon/faremon-ai-prompts'
import { generateFareMonTeamResponseSchema } from '@/lib/faremon/faremon-ai-zod'
import { createRandomFareMonTeam } from '@/lib/faremon/faremon-fallback-team'
import { validateGeneratedFareMonTeam } from '@/lib/faremon/faremon-validate-team'
import type { FareMonType } from '@/lib/faremon/types'

const bodySchema = z.object({
  playerId: z.string(),
  selectedTypes: z.tuple([z.string(), z.string()]),
  routeContext: z.object({
    pickup: z.string(),
    destination: z.string(),
    normalFare: z.number(),
    timeOfDay: z.string(),
    weather: z.string(),
    city: z.string(),
  }),
  matchSeed: z.string(),
})

const TEXT_MODEL = process.env.TEXT_MODEL || 'openai/gpt-4.1-mini'

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const generationNonce = randomUUID()
  const selectedTypes = parsed.selectedTypes as [FareMonType, FareMonType]
  const seedHint = `${parsed.matchSeed}|${parsed.playerId}|${generationNonce}`

  const prompt = buildFareMonTeamGenerationPrompt({
    selectedTypes,
    routeContext: parsed.routeContext,
    playerId: parsed.playerId,
    matchSeed: parsed.matchSeed,
    generationNonce,
  })

  let objectOut: unknown = null

  try {
    const result = await generateObject({
      model: TEXT_MODEL,
      schema: generateFareMonTeamResponseSchema,
      prompt,
      temperature: 1.05,
    })
    objectOut = result.object
  } catch {
    objectOut = null
  }

  const aiValidated =
    objectOut != null ? validateGeneratedFareMonTeam(objectOut, selectedTypes, seedHint) : null

  let faremons = aiValidated?.faremons
  let usedFallback = !faremons

  if (!faremons) {
    faremons = createRandomFareMonTeam({
      selectedTypes,
      routeContext: parsed.routeContext,
      playerId: parsed.playerId,
      matchSeed: `${parsed.matchSeed}|fallback|${generationNonce}`,
    })
    usedFallback = true
  }

  return NextResponse.json({
    faremons,
    generationNonce,
    usedFallback,
  })
}
