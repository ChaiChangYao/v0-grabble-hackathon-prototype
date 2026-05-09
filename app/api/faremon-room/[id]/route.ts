import { NextResponse } from 'next/server'
import { getFaremonRooms } from '@/lib/faremon-room-store'
import type { FareMonBattleState } from '@/lib/faremon/types'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const rooms = getFaremonRooms()
  const row = rooms.get(id.toUpperCase())
  if (!row) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  return NextResponse.json(row)
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const rooms = getFaremonRooms()
  const key = id.toUpperCase()
  let body: { fareMonState?: FareMonBattleState }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.fareMonState) {
    return NextResponse.json({ error: 'fareMonState required' }, { status: 400 })
  }
  const prev = rooms.get(key)
  const version = (prev?.version ?? 0) + 1
  const payload = {
    fareMonState: body.fareMonState,
    updatedAt: Date.now(),
    version,
  }
  rooms.set(key, payload)
  return NextResponse.json(payload)
}
