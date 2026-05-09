import { NextRequest, NextResponse } from 'next/server'
import { canResolveFareMonTurn, resolveFareMonTurn } from '@/lib/faremon-engine'
import { getGrabbleRoom, patchGrabbleRoom, resolvePlayerRole } from '@/lib/grabble-room-store'

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
  if (!room?.faremonState) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (resolvePlayerRole(room, playerId) === null) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  if (room.status !== 'faremon-battle') {
    return NextResponse.json({ error: 'BAD_STATE' }, { status: 409 })
  }
  const fs = room.faremonState
  if (!canResolveFareMonTurn(fs)) {
    return NextResponse.json({ error: 'CANNOT_RESOLVE' }, { status: 400 })
  }

  const next = resolveFareMonTurn(fs)
  const res = await patchGrabbleRoom(roomCode, {
    expectedVersion: body.expectedVersion ?? room.version,
    faremonState: next,
    status: next.gameOver ? 'result' : 'faremon-battle',
    winner: next.winner,
  })
  if (!res.ok) {
    if (res.error === 'VERSION_MISMATCH') {
      return NextResponse.json({ error: 'VERSION_MISMATCH', room: res.room }, { status: 409 })
    }
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  return NextResponse.json({ room: res.room })
}
