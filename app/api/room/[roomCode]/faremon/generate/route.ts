import { NextRequest, NextResponse } from 'next/server'
import { defaultPlayer1, defaultPlayer2 } from '@/lib/grabble-types'
import { applyGeneratedFareMonTeam } from '@/lib/faremon-engine'
import type { FareMon, FareMonGeneratedImages, FareMonType } from '@/lib/faremon/types'
import { getGrabbleRoom, patchGrabbleRoom } from '@/lib/grabble-room-store'

export async function POST(req: NextRequest, ctx: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await ctx.params
  let body: { playerId?: string; expectedVersion?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const playerId = body.playerId?.trim()
  if (!playerId) return NextResponse.json({ error: 'playerId required' }, { status: 400 })

  const room = await getGrabbleRoom(roomCode)
  if (!room) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (room.player1Id !== playerId) {
    return NextResponse.json({ error: 'ONLY_HOST_GENERATES' }, { status: 403 })
  }
  if (room.faremonGenerationStarted) {
    return NextResponse.json({ error: 'ALREADY_GENERATING', room }, { status: 409 })
  }
  if (room.status !== 'faremon-type-selection' || !room.faremonState) {
    return NextResponse.json({ error: 'BAD_STATE' }, { status: 409 })
  }

  const fs = room.faremonState
  if (
    fs.player1Team.selectedTypes.length !== 2 ||
    fs.player2Team.selectedTypes.length !== 2 ||
    !fs.player1Team.locked ||
    !fs.player2Team.locked
  ) {
    return NextResponse.json({ error: 'TYPES_NOT_READY' }, { status: 400 })
  }

  let lockRes = await patchGrabbleRoom(roomCode, {
    expectedVersion: body.expectedVersion ?? room.version,
    faremonGenerating: true,
    faremonGenerationStarted: true,
    status: 'faremon-generating-team',
  })
  if (!lockRes.ok) {
    if (lockRes.error === 'VERSION_MISMATCH') {
      return NextResponse.json({ error: 'VERSION_MISMATCH', room: lockRes.room }, { status: 409 })
    }
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const origin = req.nextUrl.origin
  const matchSeed = room.roomCode

  const buildBody = (pid: 'player1' | 'player2', p: typeof defaultPlayer1) => ({
    playerId: pid,
    selectedTypes: (pid === 'player1' ? fs.player1Team.selectedTypes : fs.player2Team.selectedTypes) as [
      FareMonType,
      FareMonType,
    ],
    routeContext: {
      pickup: p.pickup,
      destination: p.destination,
      normalFare: p.normalFare,
      timeOfDay: 'peak hour',
      weather: 'rainy',
      city: 'Singapore',
    },
    matchSeed: `${matchSeed}|${pid}`,
  })

  try {
    const [res1, res2] = await Promise.all([
      fetch(`${origin}/api/ai/generate-faremon-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody('player1', defaultPlayer1)),
      }),
      fetch(`${origin}/api/ai/generate-faremon-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody('player2', defaultPlayer2)),
      }),
    ])

    if (!res1.ok || !res2.ok) {
      await patchGrabbleRoom(roomCode, {
        faremonGenerating: false,
        faremonGenerationStarted: false,
        status: 'faremon-type-selection',
      })
      return NextResponse.json(
        { error: 'GENERATION_FAILED', detail: await res1.text().catch(() => '') },
        { status: 502 },
      )
    }

    const d1 = (await res1.json()) as { faremons: [FareMon, FareMon] }
    const d2 = (await res2.json()) as { faremons: [FareMon, FareMon] }
    let pair1 = d1.faremons
    let pair2 = d2.faremons

    let next = applyGeneratedFareMonTeam(fs, 1, pair1)
    next = applyGeneratedFareMonTeam(next, 2, pair2)

    const p1Active =
      next.player1Team.activeFareMonIndex === 0 ? next.player1Team.faremon1 : next.player1Team.faremon2
    const p2Active =
      next.player2Team.activeFareMonIndex === 0 ? next.player2Team.faremon1 : next.player2Team.faremon2

    const imagesLock = await patchGrabbleRoom(roomCode, {
      faremonState: {
        ...next,
        imageGenerationStarted: true,
        imageGenerationCompleted: false,
        imageGenerationError: null,
      },
      status: 'faremon-generating-images',
      faremonGenerating: true,
    })
    if (!imagesLock.ok) return NextResponse.json({ error: 'SAVE_FAILED' }, { status: 500 })

    if (p1Active && p2Active) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25000)
      try {
        const imageRes = await fetch(`${origin}/api/ai/generate-faremon-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
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
        if (imageRes.ok) {
          const imageData = (await imageRes.json()) as { generatedImages: FareMonGeneratedImages }
          next = {
            ...next,
            generatedImages: imageData.generatedImages,
            backgroundPrompt: imageData.generatedImages.backgroundPrompt,
            imageGenerationStarted: true,
            imageGenerationCompleted: true,
            imageGenerationError: null,
          }
        } else {
          next = {
            ...next,
            imageGenerationStarted: true,
            imageGenerationCompleted: false,
            imageGenerationError: 'Image generation timed out or failed. Battle still started.',
          }
        }
      } catch {
        next = {
          ...next,
          imageGenerationStarted: true,
          imageGenerationCompleted: false,
          imageGenerationError: 'Image generation timed out or failed. Battle still started.',
        }
      } finally {
        clearTimeout(timeout)
      }
    }

    const finalRes = await patchGrabbleRoom(roomCode, {
      faremonState: next,
      status: 'faremon-battle',
      faremonGenerating: false,
    })
    if (!finalRes.ok) return NextResponse.json({ error: 'SAVE_FAILED' }, { status: 500 })
    return NextResponse.json({ room: finalRes.room })
  } catch (e) {
    await patchGrabbleRoom(roomCode, {
      faremonGenerating: false,
      faremonGenerationStarted: false,
      status: 'faremon-type-selection',
    })
    return NextResponse.json(
      { error: 'GENERATION_EXCEPTION', message: e instanceof Error ? e.message : 'error' },
      { status: 500 },
    )
  }
}
