import type { FareMonBattleState } from '@/lib/faremon/types'
import type { BattleRouteState } from '@/lib/battleroute-engine'

export type MatchGameKind = 'faremon' | 'battleship'

export type MatchGameStatus =
  | 'lobby'
  | 'selecting_game'
  | 'game_selected'
  | 'playing'
  | 'finished'

export interface MatchGameData {
  faremon?: FareMonBattleState | null
  battleship?: BattleRouteState | null
}

export interface MatchSession {
  matchId: string
  player1Connected: boolean
  player2Connected: boolean
  player1Id: string | null
  player2Id: string | null
  selectedGame: MatchGameKind | null
  gameStatus: MatchGameStatus
  player1State: Record<string, unknown>
  player2State: Record<string, unknown>
  currentTurn: 1 | 2 | null
  gameData: MatchGameData
  winner: 1 | 2 | null
  version: number
  updatedAt: number
  disconnectedPlayer: 1 | 2 | null
}

const globalForMatch = globalThis as typeof globalThis & {
  __matchSessions?: Map<string, MatchSession>
}

export function getMatchSessions(): Map<string, MatchSession> {
  if (!globalForMatch.__matchSessions) {
    globalForMatch.__matchSessions = new Map()
  }
  return globalForMatch.__matchSessions
}

function newMatchId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

export function createMatchSession(): MatchSession {
  const matchId = newMatchId()
  const session: MatchSession = {
    matchId,
    player1Connected: false,
    player2Connected: false,
    player1Id: null,
    player2Id: null,
    selectedGame: null,
    gameStatus: 'lobby',
    player1State: {},
    player2State: {},
    currentTurn: null,
    gameData: {},
    winner: null,
    version: 1,
    updatedAt: Date.now(),
    disconnectedPlayer: null,
  }
  getMatchSessions().set(matchId, session)
  return session
}

export function getMatchSession(matchId: string): MatchSession | undefined {
  return getMatchSessions().get(matchId.toUpperCase())
}

function bump(s: MatchSession): void {
  s.version += 1
  s.updatedAt = Date.now()
}

function maybeSelectGame(s: MatchSession): void {
  if (s.player1Connected && s.player2Connected && s.gameStatus === 'lobby' && !s.selectedGame) {
    s.selectedGame = Math.random() < 0.5 ? 'faremon' : 'battleship'
    s.gameStatus = 'game_selected'
  }
}

export type ConnectResult =
  | { ok: true; session: MatchSession }
  | { ok: false; error: 'NOT_FOUND' | 'FULL' | 'BAD_ROLE' }

export function connectPlayer(
  matchId: string,
  role: 1 | 2,
  clientId: string,
  profile?: Record<string, unknown>,
): ConnectResult {
  const s = getMatchSession(matchId)
  if (!s) return { ok: false, error: 'NOT_FOUND' }

  if (role === 1) {
    if (s.player1Id !== null && s.player1Id !== clientId) {
      return { ok: false, error: 'FULL' }
    }
    s.player1Id = clientId
    s.player1Connected = true
    if (profile && Object.keys(profile).length > 0) {
      s.player1State = { ...s.player1State, ...profile }
    }
    if (s.disconnectedPlayer === 1) s.disconnectedPlayer = null
    maybeSelectGame(s)
    bump(s)
    return { ok: true, session: s }
  }

  if (s.player2Id !== null && s.player2Id !== clientId) {
    return { ok: false, error: 'FULL' }
  }
  s.player2Id = clientId
  s.player2Connected = true
  if (profile && Object.keys(profile).length > 0) {
    s.player2State = { ...s.player2State, ...profile }
  }
  if (s.disconnectedPlayer === 2) s.disconnectedPlayer = null
  maybeSelectGame(s)
  bump(s)
  return { ok: true, session: s }
}

export function updateMatchGameData(
  matchId: string,
  patch: {
    gameData?: Partial<MatchGameData>
    currentTurn?: 1 | 2 | null
    winner?: 1 | 2 | null
    gameStatus?: MatchGameStatus
    player1State?: Record<string, unknown>
    player2State?: Record<string, unknown>
    expectedVersion?: number
  },
): MatchSession | { error: 'VERSION_MISMATCH'; session: MatchSession } | undefined {
  const s = getMatchSession(matchId)
  if (!s) return undefined
  if (patch.expectedVersion !== undefined && patch.expectedVersion !== s.version) {
    return { error: 'VERSION_MISMATCH', session: s }
  }
  if (patch.gameData) {
    if (patch.gameData.faremon !== undefined) {
      s.gameData.faremon = patch.gameData.faremon
    }
    if (patch.gameData.battleship !== undefined) {
      s.gameData.battleship = patch.gameData.battleship
    }
  }
  if (patch.currentTurn !== undefined) s.currentTurn = patch.currentTurn
  if (patch.winner !== undefined) s.winner = patch.winner
  if (patch.gameStatus !== undefined) s.gameStatus = patch.gameStatus
  if (patch.player1State) s.player1State = { ...s.player1State, ...patch.player1State }
  if (patch.player2State) s.player2State = { ...s.player2State, ...patch.player2State }
  bump(s)
  return s
}

export function setMatchPlaying(matchId: string): MatchSession | undefined {
  const s = getMatchSession(matchId)
  if (!s) return undefined
  s.gameStatus = 'playing'
  bump(s)
  return s
}

export function markDisconnected(matchId: string, role: 1 | 2): MatchSession | undefined {
  const s = getMatchSession(matchId)
  if (!s) return undefined
  if (role === 1) s.player1Connected = false
  else s.player2Connected = false
  s.disconnectedPlayer = role
  bump(s)
  return s
}

export function verifyClientForRole(s: MatchSession, role: 1 | 2, clientId: string): boolean {
  if (role === 1) return s.player1Id === clientId
  return s.player2Id === clientId
}
