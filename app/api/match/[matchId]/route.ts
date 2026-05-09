import { NextResponse } from 'next/server'
import {
  connectPlayer,
  getMatchSession,
  updateMatchGameData,
  markDisconnected,
  verifyClientForRole,
  setMatchPlaying,
  type MatchSession,
  type MatchGameData,
  type MatchGameStatus,
} from '@/lib/match-session-store'

function serializeSession(s: MatchSession) {
  return {
    matchId: s.matchId,
    player1Connected: s.player1Connected,
    player2Connected: s.player2Connected,
    player1State: s.player1State,
    player2State: s.player2State,
    selectedGame: s.selectedGame,
    gameStatus: s.gameStatus,
    currentTurn: s.currentTurn,
    gameData: s.gameData,
    winner: s.winner,
    version: s.version,
    updatedAt: s.updatedAt,
    disconnectedPlayer: s.disconnectedPlayer,
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await ctx.params
  const s = getMatchSession(matchId)
  if (!s) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  return NextResponse.json(serializeSession(s))
}

export async function PATCH(req: Request, ctx: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await ctx.params
  let body: {
    action?: string
    role?: 1 | 2
    clientId?: string
    profile?: Record<string, unknown>
    expectedVersion?: number
    patch?: {
      gameData?: { faremon?: unknown; battleship?: unknown }
      currentTurn?: 1 | 2 | null
      winner?: 1 | 2 | null
      gameStatus?: string
      player1State?: Record<string, unknown>
      player2State?: Record<string, unknown>
    }
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action ?? 'sync'

  if (action === 'connect') {
    if (!body.clientId || !body.role) {
      return NextResponse.json({ error: 'clientId and role required' }, { status: 400 })
    }
    const result = connectPlayer(matchId, body.role, body.clientId, body.profile)
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json(serializeSession(result.session))
  }

  if (action === 'disconnect') {
    if (!body.clientId || !body.role) {
      return NextResponse.json({ error: 'clientId and role required' }, { status: 400 })
    }
    const s = getMatchSession(matchId)
    if (!s) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (!verifyClientForRole(s, body.role, body.clientId)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    const next = markDisconnected(matchId, body.role)
    if (!next) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json(serializeSession(next))
  }

  if (action === 'start_playing') {
    if (!body.clientId || body.role !== 1) {
      return NextResponse.json({ error: 'Player 1 clientId required' }, { status: 400 })
    }
    const s = getMatchSession(matchId)
    if (!s) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (!verifyClientForRole(s, 1, body.clientId)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    const next = setMatchPlaying(matchId)
    if (!next) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json(serializeSession(next))
  }

  if (action === 'sync') {
    if (!body.clientId || !body.role) {
      return NextResponse.json({ error: 'clientId and role required' }, { status: 400 })
    }
    const s0 = getMatchSession(matchId)
    if (!s0) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (!verifyClientForRole(s0, body.role, body.clientId)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    if (!body.patch) {
      return NextResponse.json({ error: 'patch required' }, { status: 400 })
    }
    const patchIn = body.patch as {
      gameData?: Partial<MatchGameData>
      currentTurn?: 1 | 2 | null
      winner?: 1 | 2 | null
      gameStatus?: MatchGameStatus
      player1State?: Record<string, unknown>
      player2State?: Record<string, unknown>
    }
    const updated = updateMatchGameData(matchId, {
      ...patchIn,
      expectedVersion: body.expectedVersion,
    })
    if (!updated) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if ('error' in updated && updated.error === 'VERSION_MISMATCH') {
      return NextResponse.json(
        { error: 'VERSION_MISMATCH', session: serializeSession(updated.session) },
        { status: 409 },
      )
    }
    return NextResponse.json(serializeSession(updated as MatchSession))
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
