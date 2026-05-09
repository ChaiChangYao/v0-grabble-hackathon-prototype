import { NextResponse } from 'next/server'
import { getFaremonRooms, makeRoomId } from '@/lib/faremon-room-store'
import { createInitialFareMonBattleState } from '@/lib/faremon/engine'

export async function POST() {
  const id = makeRoomId()
  const rooms = getFaremonRooms()
  rooms.set(id, {
    fareMonState: createInitialFareMonBattleState(),
    updatedAt: Date.now(),
    version: 1,
  })
  const origin = process.env.NEXT_PUBLIC_SITE_URL || ''
  const guestHint =
    typeof origin === 'string' && origin
      ? `${origin}/?faremonRoom=${id}&role=2`
      : `/?faremonRoom=${id}&role=2`
  return NextResponse.json({ roomId: id, guestUrlHint: guestHint })
}
