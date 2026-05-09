import { NextResponse } from 'next/server'
import {
  enterGrabbleRoom,
  getGrabbleRoom,
  markDisconnected,
  patchGrabbleRoom,
  resolvePlayerRole,
} from '@/lib/grabble-room-store'
import type { GrabbleRoom } from '@/lib/grabble-room-types'
import { createInitialFareMonBattleState } from '@/lib/faremon-engine'
import type { RoomPatch } from '@/lib/grabble-room-store'

function jsonRoom(r: GrabbleRoom) {
  return r
}

export async function GET(_req: Request, ctx: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await ctx.params
  const room = await getGrabbleRoom(roomCode)
  if (!room) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  return NextResponse.json(jsonRoom(room))
}

export async function PATCH(req: Request, ctx: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await ctx.params

  let body: {
    action: string
    playerId?: string
    expectedVersion?: number
    patch?: RoomPatch
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const playerId = body.playerId?.trim()
  if (!playerId) {
    return NextResponse.json({ error: 'playerId required' }, { status: 400 })
  }

  if (body.action === 'enter') {
    const result = await enterGrabbleRoom(roomCode, playerId)
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json({ room: result.room, role: result.role })
  }

  const room0 = await getGrabbleRoom(roomCode)
  if (!room0) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const role = resolvePlayerRole(room0, playerId)
  if (role === null) {
    return NextResponse.json({ error: 'NOT_IN_ROOM' }, { status: 403 })
  }

  if (body.action === 'disconnect') {
    const next = await markDisconnected(roomCode, role)
    if (!next) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ room: next })
  }

  if (body.action === 'start-challenge') {
    if (role !== 1) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    const r = room0
    if (r.status !== 'ready') {
      return NextResponse.json({ error: 'BAD_STATE' }, { status: 409 })
    }
    const fs = createInitialFareMonBattleState()
    const res = await patchGrabbleRoom(roomCode, {
      expectedVersion: body.expectedVersion ?? r.version,
      status: 'faremon-type-selection',
      selectedGame: 'faremon',
      faremonState: fs,
    })
    if (!res.ok) {
      if (res.error === 'NOT_FOUND') return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
      return NextResponse.json({ error: 'VERSION_MISMATCH', room: res.room }, { status: 409 })
    }
    return NextResponse.json({ room: res.room })
  }

  if (body.action === 'sync') {
    if (!body.patch) return NextResponse.json({ error: 'patch required' }, { status: 400 })
    const res = await patchGrabbleRoom(roomCode, {
      ...body.patch,
      expectedVersion: body.expectedVersion,
    })
    if (!res.ok) {
      if (res.error === 'NOT_FOUND') return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
      return NextResponse.json({ error: 'VERSION_MISMATCH', room: res.room }, { status: 409 })
    }
    return NextResponse.json({ room: res.room })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
