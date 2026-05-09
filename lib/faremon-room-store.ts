import type { FareMonBattleState } from '@/lib/faremon/types'

export interface FaremonRoomPayload {
  fareMonState: FareMonBattleState
  updatedAt: number
  version: number
}

const globalForRooms = globalThis as typeof globalThis & {
  __faremonRooms?: Map<string, FaremonRoomPayload>
}

export function getFaremonRooms(): Map<string, FaremonRoomPayload> {
  if (!globalForRooms.__faremonRooms) {
    globalForRooms.__faremonRooms = new Map()
  }
  return globalForRooms.__faremonRooms
}

export function makeRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
