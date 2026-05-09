import { NextRequest, NextResponse } from 'next/server'
import { defaultPlayer1 } from '@/lib/grabble-types'
import { getGrabbleRoom, patchGrabbleRoom, resolvePlayerRole } from '@/lib/grabble-room-store'
import type { FareMonGeneratedImages } from '@/lib/faremon/types'

function requestOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  if (host) return `${proto}://${host}`
  return 'http://localhost:3000'
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await ctx.params
  let body: { playerId?: string; force?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const playerId = body.playerId?.trim()
  if (!playerId) return NextResponse.json({ error: 'playerId required' }, { status: 400 })

  const room = await getGrabbleRoom(roomCode)
  if (!room?.faremonState) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (resolvePlayerRole(room, playerId) === null) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  if (room.faremonState.imageGenerationStarted && !body.force) {
    return NextResponse.json({ error: 'ALREADY_STARTED', room }, { status: 409 })
  }

  const fs = {
    ...room.faremonState,
    generatedImages: null,
    imageGenerationStarted: true,
    imageGenerationCompleted: false,
    imageGenerationError: null,
  }

  const p1Active =
    fs.player1Team.activeFareMonIndex === 0 ? fs.player1Team.faremon1 : fs.player1Team.faremon2
  const p2Active =
    fs.player2Team.activeFareMonIndex === 0 ? fs.player2Team.faremon1 : fs.player2Team.faremon2
  if (!p1Active || !p2Active) {
    return NextResponse.json({ error: 'ACTIVE_FAREMON_MISSING' }, { status: 400 })
  }

  await patchGrabbleRoom(roomCode, {
    faremonState: fs,
    status: 'faremon-generating-images',
    faremonGenerating: true,
  })

  const imageRes = await fetch(`${requestOrigin(req)}/api/ai/generate-faremon-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: room.roomCode,
      battleId: `${room.roomCode}-faremon`,
      routeContext: {
        city: 'Singapore',
        pickup: defaultPlayer1.pickup,
        destination: defaultPlayer1.destination,
        weather: 'rainy',
        timeOfDay: 'peak hour',
      },
      player1ActiveFareMon: p1Active,
      player2ActiveFareMon: p2Active,
    }),
  })

  if (!imageRes.ok) {
    const failed = {
      ...fs,
      imageGenerationStarted: true,
      imageGenerationCompleted: false,
      imageGenerationError: 'Image generation failed. Check image model/API configuration.',
    }
    const out = await patchGrabbleRoom(roomCode, {
      faremonState: failed,
      faremonGenerating: false,
      status: 'faremon-generating-images',
    })
    return NextResponse.json(
      {
        error: 'IMAGE_GENERATION_FAILED',
        detail: await imageRes.text().catch(() => ''),
        room: out.ok ? out.room : room,
      },
      { status: 502 },
    )
  }

  const imageData = (await imageRes.json()) as {
    generatedImages: FareMonGeneratedImages
  }

  const next = {
    ...fs,
    generatedImages: imageData.generatedImages,
    backgroundPrompt: imageData.generatedImages.backgroundPrompt,
    imageGenerationStarted: true,
    imageGenerationCompleted: true,
    imageGenerationError: null,
    player1Team: {
      ...fs.player1Team,
      faremon1: fs.player1Team.faremon1
        ? {
            ...fs.player1Team.faremon1,
            visualIdentity: imageData.generatedImages.player1.visualIdentity,
            characterPromptFront: imageData.generatedImages.player1.frontPrompt,
            characterPromptBack: imageData.generatedImages.player1.backPrompt,
            frontImageUrl: imageData.generatedImages.player1.frontImageUrl,
            backImageUrl: imageData.generatedImages.player1.backImageUrl,
          }
        : null,
    },
    player2Team: {
      ...fs.player2Team,
      faremon1: fs.player2Team.faremon1
        ? {
            ...fs.player2Team.faremon1,
            visualIdentity: imageData.generatedImages.player2.visualIdentity,
            characterPromptFront: imageData.generatedImages.player2.frontPrompt,
            characterPromptBack: imageData.generatedImages.player2.backPrompt,
            frontImageUrl: imageData.generatedImages.player2.frontImageUrl,
            backImageUrl: imageData.generatedImages.player2.backImageUrl,
          }
        : null,
    },
  }

  const res = await patchGrabbleRoom(roomCode, {
    faremonState: next,
    faremonGenerating: false,
    status: 'faremon-battle',
  })
  if (!res.ok) return NextResponse.json({ error: 'SAVE_FAILED' }, { status: 500 })
  return NextResponse.json({ room: res.room })
}
