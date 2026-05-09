import { Redis } from '@upstash/redis'
import type { FareMonBattleState } from '@/lib/faremon/types'
import type { BattleRouteState } from '@/lib/battleroute-engine'
import type { GrabbleRoom, GrabbleRoomStatus } from '@/lib/grabble-room-types'

const TTL_SEC = 60 * 60 * 24 * 7

const globalRooms = globalThis as typeof globalThis & {
  __grabbleRooms?: Map<string, GrabbleRoom>
}

function mem(): Map<string, GrabbleRoom> {
  if (!globalRooms.__grabbleRooms) globalRooms.__grabbleRooms = new Map()
  return globalRooms.__grabbleRooms
}

let redisSingleton: Redis | null | undefined

function getRedis(): Redis | null {
  if (redisSingleton !== undefined) return redisSingleton
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      redisSingleton = null
      return null
    }
    redisSingleton = Redis.fromEnv()
    return redisSingleton
  } catch {
    redisSingleton = null
    return null
  }
}

function roomKey(code: string): string {
  return `grabble:room:${code.toUpperCase()}`
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase()
}

function newRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function bump(r: GrabbleRoom): void {
  r.version += 1
  r.updatedAt = Date.now()
}

async function saveRoom(room: GrabbleRoom): Promise<void> {
  const k = normalizeRoomCode(room.roomCode)
  room.roomCode = k
  mem().set(k, { ...room })
  const redis = getRedis()
  if (redis) {
    await redis.set(roomKey(k), JSON.stringify(room), { ex: TTL_SEC })
  }
}

export async function getGrabbleRoom(roomCode: string): Promise<GrabbleRoom | undefined> {
  const k = normalizeRoomCode(roomCode)
  const redis = getRedis()
  if (redis) {
    try {
      const raw = await redis.get<string>(roomKey(k))
      if (raw != null) {
        const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as GrabbleRoom
        mem().set(k, parsed)
        return parsed
      }
    } catch {
      /* fall through */
    }
  }
  return mem().get(k)
}

export async function createGrabbleRoom(creatorPlayerId: string): Promise<GrabbleRoom> {
  const room: GrabbleRoom = {
    roomCode: newRoomCode(),
    version: 1,
    updatedAt: Date.now(),
    status: 'waiting-for-player2',
    player1Id: creatorPlayerId,
    player2Id: null,
    player1Connected: true,
    player2Connected: false,
    disconnectedPlayer: null,
    selectedGame: null,
    faremonState: null,
    battleshipState: null,
    faremonGenerationStarted: false,
    faremonGenerating: false,
    winner: null,
    faremonResolvingTurn: false,
  }
  await saveRoom(room)
  return room
}

export type EnterResult =
  | { ok: true; room: GrabbleRoom; role: 1 | 2 }
  | { ok: false; error: 'NOT_FOUND' | 'FULL' }

export async function enterGrabbleRoom(roomCode: string, playerId: string): Promise<EnterResult> {
  const room = await getGrabbleRoom(roomCode)
  if (!room) return { ok: false, error: 'NOT_FOUND' }

  if (room.player1Id === playerId) {
    room.player1Connected = true
    if (room.disconnectedPlayer === 1) room.disconnectedPlayer = null
    bump(room)
    await saveRoom(room)
    return { ok: true, room, role: 1 }
  }
  if (room.player2Id === playerId) {
    room.player2Connected = true
    if (room.disconnectedPlayer === 2) room.disconnectedPlayer = null
    bump(room)
    await saveRoom(room)
    return { ok: true, room, role: 2 }
  }
  if (!room.player2Id) {
    room.player2Id = playerId
    room.player2Connected = true
    if (room.status === 'waiting-for-player2') {
      room.status = 'ready'
    }
    if (room.disconnectedPlayer === 2) room.disconnectedPlayer = null
    bump(room)
    await saveRoom(room)
    return { ok: true, room, role: 2 }
  }
  return { ok: false, error: 'FULL' }
}

export function resolvePlayerRole(room: GrabbleRoom, playerId: string): 1 | 2 | null {
  if (room.player1Id === playerId) return 1
  if (room.player2Id === playerId) return 2
  return null
}

export async function markDisconnected(roomCode: string, role: 1 | 2): Promise<GrabbleRoom | undefined> {
  const room = await getGrabbleRoom(roomCode)
  if (!room) return undefined
  if (role === 1) room.player1Connected = false
  else room.player2Connected = false
  room.disconnectedPlayer = role
  bump(room)
  await saveRoom(room)
  return room
}

export type RoomPatch = {
  status?: GrabbleRoomStatus
  selectedGame?: 'faremon' | 'battleship' | null
  faremonState?: FareMonBattleState | null
  battleshipState?: BattleRouteState | null
  winner?: 1 | 2 | null
  faremonGenerationStarted?: boolean
  faremonGenerating?: boolean
  faremonResolvingTurn?: boolean
  expectedVersion?: number
}

export type PatchResult =
  | { ok: true; room: GrabbleRoom }
  | { ok: false; error: 'NOT_FOUND' }
  | { ok: false; error: 'VERSION_MISMATCH'; room: GrabbleRoom }

export async function patchGrabbleRoom(roomCode: string, patch: RoomPatch): Promise<PatchResult> {
  const room = await getGrabbleRoom(roomCode)
  if (!room) return { ok: false, error: 'NOT_FOUND' }

  if (patch.expectedVersion !== undefined && patch.expectedVersion !== room.version) {
    const cur = await getGrabbleRoom(roomCode)
    return { ok: false, error: 'VERSION_MISMATCH', room: cur ?? room }
  }

  if (patch.status !== undefined) room.status = patch.status
  if (patch.selectedGame !== undefined) room.selectedGame = patch.selectedGame
  if (patch.faremonState !== undefined) room.faremonState = patch.faremonState
  if (patch.battleshipState !== undefined) room.battleshipState = patch.battleshipState
  if (patch.winner !== undefined) room.winner = patch.winner
  if (patch.faremonGenerationStarted !== undefined) room.faremonGenerationStarted = patch.faremonGenerationStarted
  if (patch.faremonGenerating !== undefined) room.faremonGenerating = patch.faremonGenerating
  if (patch.faremonResolvingTurn !== undefined) room.faremonResolvingTurn = patch.faremonResolvingTurn

  bump(room)
  await saveRoom(room)
  return { ok: true, room }
}
