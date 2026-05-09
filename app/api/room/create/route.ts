import { NextResponse } from 'next/server'
import { createGrabbleRoom } from '@/lib/grabble-room-store'

export async function POST(req: Request) {
  let body: { playerId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const playerId = body.playerId?.trim()
  if (!playerId) {
    return NextResponse.json({ error: 'playerId required' }, { status: 400 })
  }
  const room = await createGrabbleRoom(playerId)
  return NextResponse.json({ roomCode: room.roomCode, room })
}
