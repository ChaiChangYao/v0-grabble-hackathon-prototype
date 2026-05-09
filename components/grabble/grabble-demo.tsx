'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { PhoneFrame } from './phone-frame'
import { RideOptionsScreen } from './screens/ride-options-screen'
import { GrabbleOptInScreen } from './screens/grabble-optin-screen'
import { MatchmakingScreen } from './screens/matchmaking-screen'
import { FareMonTypeSelectionScreen } from './screens/faremon-type-selection-screen'
import { FareMonBattleScreen } from './screens/faremon-battle-screen'
import { BattleRouteScreen } from './screens/battleroute-screen'
import { ResultsScreen } from './screens/results-screen'
import { BookingConfirmationScreen } from './screens/booking-confirmation-screen'
import {
  Screen,
  GameType,
  defaultPlayer1,
  defaultPlayer2,
} from '@/lib/grabble-types'
import {
  FareMonBattleState,
  FareMonType,
  FareMonMove,
  type FareMon,
  createInitialFareMonBattleState,
  selectType,
  applyGeneratedFareMonTeam,
  resolveFareMonTurn,
  canResolveFareMonTurn,
} from '@/lib/faremon-engine'
import { buildFareMonCreatureImagePrompts } from '@/lib/faremon/faremon-ai-prompts'
import {
  createBattleRouteState,
  placeRouteAsset,
  submitRouteAttack,
  routeAssets,
  type BattleRouteState,
} from '@/lib/battleroute-engine'
import { RotateCcw, Sparkles, Link2 } from 'lucide-react'
import { getMatchClientId } from '@/lib/match-client-id'
import type { GrabbleRoom } from '@/lib/grabble-room-types'

type RideOptionId = 'grabble' | 'justgrab' | 'metered-taxi' | 'car-only'

type ExtendedScreen = Screen | 'faremon-type-selection' | 'faremon-battle'

export interface GrabbleDemoProps {
  faremonRoomId?: string
  /** When set with faremonRoomId, only one phone frame is shown for online play */
  faremonRemoteRole?: 1 | 2
  /** Shared 2-device match session (Player 1 creates; Player 2 joins link) */
  matchSessionId?: string
  matchRole?: 1 | 2
  matchGame?: 'faremon' | 'battleship'
  /** New durable room flow — single phone; serverRoom is source of truth */
  viewMode?: 'local-demo' | 'real-multiplayer'
  grabbleRoomCode?: string
  grabblePlayerId?: string
  resolvedRole?: 1 | 2
  serverRoom?: GrabbleRoom | null
  onServerRoomUpdate?: (room: GrabbleRoom) => void
}

interface GameState {
  currentScreen: ExtendedScreen
  selectedRideOption: RideOptionId
  selectedGame: GameType | null
  fareMonState: FareMonBattleState | null
  battleRouteState: BattleRouteState | null
  winner: 1 | 2 | null
}

const initialState: GameState = {
  currentScreen: 'ride-options', // Start directly on ride options
  selectedRideOption: 'grabble', // Grabble selected by default
  selectedGame: null,
  fareMonState: null,
  battleRouteState: null,
  winner: null,
}

function deriveGrabbleScreen(room: GrabbleRoom): ExtendedScreen {
  const st = room.status
  if (st === 'pregame') return 'ride-options'
  if (
    st === 'faremon-type-selection' ||
    st === 'faremon-generating' ||
    st === 'faremon-generating-team' ||
    st === 'faremon-generating-images'
  ) {
    return 'faremon-type-selection'
  }
  if (st === 'faremon-battle') {
    if (!room.faremonState) return 'faremon-type-selection'
    if (room.faremonState.gameOver) return 'results'
    return 'faremon-battle'
  }
  if (st === 'result') return 'results'
  return 'faremon-type-selection'
}

async function attachFaremonSprites(pair: [FareMon, FareMon]): Promise<[FareMon, FareMon]> {
  const items = pair.map((fm) => {
    const vi =
      fm.visualIdentity?.trim() ||
      `${fm.primaryType} mobility creature named ${fm.name}; Singapore route motifs.`
    const built = buildFareMonCreatureImagePrompts({
      name: fm.name,
      primaryType: fm.primaryType,
      secondaryType: fm.secondaryType,
      visualIdentity: vi,
    })
    return {
      faremonId: fm.id,
      frontPrompt: fm.characterPromptFront?.trim() || built.frontPrompt,
      backPrompt: fm.characterPromptBack?.trim() || built.backPrompt,
    }
  })
  try {
    const r = await fetch('/api/ai/generate-faremon-sprites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    if (!r.ok) return pair
    const j = (await r.json()) as {
      results: Array<{
        faremonId: string
        frontImageUrl: string | null
        backImageUrl: string | null
      }>
    }
    const a = j.results[0]
    const b = j.results[1]
    return [
      {
        ...pair[0],
        characterPromptFront: pair[0].characterPromptFront ?? items[0]?.frontPrompt,
        characterPromptBack: pair[0].characterPromptBack ?? items[0]?.backPrompt,
        frontImageUrl: a?.frontImageUrl ?? undefined,
        backImageUrl: a?.backImageUrl ?? undefined,
      },
      {
        ...pair[1],
        characterPromptFront: pair[1].characterPromptFront ?? items[1]?.frontPrompt,
        characterPromptBack: pair[1].characterPromptBack ?? items[1]?.backPrompt,
        frontImageUrl: b?.frontImageUrl ?? undefined,
        backImageUrl: b?.backImageUrl ?? undefined,
      },
    ]
  } catch {
    return pair
  }
}

export function GrabbleDemo(props: GrabbleDemoProps = {}) {
  const {
    faremonRoomId,
    faremonRemoteRole,
    matchSessionId,
    matchRole,
    matchGame,
    viewMode = 'local-demo',
    grabbleRoomCode,
    grabblePlayerId,
    resolvedRole,
    serverRoom,
    onServerRoomUpdate,
  } = props
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<GameState>(() => ({ ...initialState }))
  const stateRef = useRef(state)
  stateRef.current = state
  const [fareMonGenerating, setFareMonGenerating] = useState<Partial<Record<1 | 2, boolean>>>({})
  const isRealRoom = Boolean(
    viewMode === 'real-multiplayer' && grabbleRoomCode && grabblePlayerId && resolvedRole,
  )

  const remoteVersion = useRef(0)
  const applyingRemote = useRef(false)
  const singleRemote = Boolean(
    (faremonRoomId && faremonRemoteRole) ||
      (matchSessionId && matchRole) ||
      (isRealRoom && resolvedRole),
  )

  const lastRoomSync = useRef(0)

  /** Authoritative room snapshot from parent poll */
  useEffect(() => {
    if (!isRealRoom || !serverRoom) return
    if (serverRoom.updatedAt <= lastRoomSync.current) return
    lastRoomSync.current = serverRoom.updatedAt
    remoteVersion.current = serverRoom.version
    applyingRemote.current = true
    setState((prev) => {
      let fareMonState = serverRoom.faremonState ?? prev.fareMonState
      if (serverRoom.status === 'faremon-type-selection' && fareMonState && prev.fareMonState && resolvedRole) {
        const next = structuredClone(fareMonState)
        const localTeam = resolvedRole === 1 ? prev.fareMonState.player1Team : prev.fareMonState.player2Team
        const remoteTeam = resolvedRole === 1 ? next.player1Team : next.player2Team
        if (localTeam.locked || localTeam.selectedTypes.length > remoteTeam.selectedTypes.length) {
          if (resolvedRole === 1) next.player1Team = localTeam
          else next.player2Team = localTeam
          fareMonState = next
        }
      }
      return {
        ...prev,
        fareMonState,
        winner: serverRoom.winner ?? serverRoom.faremonState?.winner ?? prev.winner,
        selectedGame: 'faremon-duel',
        currentScreen: deriveGrabbleScreen(serverRoom),
      }
    })
    queueMicrotask(() => {
      applyingRemote.current = false
    })
  }, [isRealRoom, serverRoom, resolvedRole])

  useEffect(() => {
    if (!isRealRoom || !grabbleRoomCode || !grabblePlayerId || applyingRemote.current) return
    const st = serverRoom?.status
    if (
      st !== 'faremon-type-selection' &&
      st !== 'faremon-generating' &&
      st !== 'faremon-generating-team' &&
      st !== 'faremon-generating-images'
    ) {
      return
    }
    const fs = state.fareMonState
    if (!fs) return
    const t = setTimeout(async () => {
      try {
        if (st === 'faremon-type-selection' && resolvedRole) {
          const team = resolvedRole === 1 ? fs.player1Team : fs.player2Team
          const r = await fetch(`/api/room/${grabbleRoomCode}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'faremon-types',
              playerId: grabblePlayerId,
              selectedTypes: team.selectedTypes,
              locked: team.locked,
            }),
          })
          if (r.ok || r.status === 409) {
            const j = (await r.json()) as { room: GrabbleRoom }
            onServerRoomUpdate?.(j.room)
            remoteVersion.current = j.room.version
          }
          return
        }

        const r = await fetch(`/api/room/${grabbleRoomCode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync',
            playerId: grabblePlayerId,
            expectedVersion: remoteVersion.current,
            patch: { faremonState: fs },
          }),
        })
        if (r.status === 409) {
          const j = (await r.json()) as { room: GrabbleRoom }
          onServerRoomUpdate?.(j.room)
          remoteVersion.current = j.room.version
          return
        }
        if (r.ok) {
          const j = (await r.json()) as { room: GrabbleRoom }
          onServerRoomUpdate?.(j.room)
          remoteVersion.current = j.room.version
        }
      } catch {
        /* ignore */
      }
    }, 400)
    return () => clearTimeout(t)
  }, [state.fareMonState, isRealRoom, grabbleRoomCode, grabblePlayerId, resolvedRole, serverRoom?.status, onServerRoomUpdate])

  useEffect(() => {
    if (!isRealRoom || !grabbleRoomCode || !grabblePlayerId) return
    if (resolvedRole !== 1) return
    if (!serverRoom?.faremonState) return
    if (serverRoom.faremonGenerationStarted || serverRoom.faremonGenerating) return
    if (serverRoom.status !== 'faremon-type-selection') return
    const fs = serverRoom.faremonState
    if (
      fs.player1Team.selectedTypes.length !== 2 ||
      fs.player2Team.selectedTypes.length !== 2 ||
      !fs.player1Team.locked ||
      !fs.player2Team.locked
    ) {
      return
    }
    const tid = setTimeout(async () => {
      try {
        const r = await fetch(`/api/room/${grabbleRoomCode}/faremon/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: grabblePlayerId,
            expectedVersion: serverRoom.version,
          }),
        })
        if (r.ok) {
          const j = (await r.json()) as { room: GrabbleRoom }
          onServerRoomUpdate?.(j.room)
          remoteVersion.current = j.room.version
        }
      } catch {
        /* ignore */
      }
    }, 600)
    return () => clearTimeout(tid)
  }, [
    isRealRoom,
    grabbleRoomCode,
    grabblePlayerId,
    resolvedRole,
    serverRoom?.version,
    serverRoom?.status,
    serverRoom?.faremonGenerationStarted,
    serverRoom?.faremonGenerating,
    serverRoom?.faremonState?.player1Team.selectedTypes,
    serverRoom?.faremonState?.player2Team.selectedTypes,
    onServerRoomUpdate,
  ])

  useEffect(() => {
    if (!isRealRoom || !grabbleRoomCode || !grabblePlayerId) return
    if (serverRoom?.status !== 'faremon-battle') return
    const fs = state.fareMonState
    if (!fs || !canResolveFareMonTurn(fs)) return
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/room/${grabbleRoomCode}/faremon/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: grabblePlayerId,
            expectedVersion: remoteVersion.current,
          }),
        })
        if (r.ok) {
          const j = (await r.json()) as { room: GrabbleRoom }
          onServerRoomUpdate?.(j.room)
          remoteVersion.current = j.room.version
        }
      } catch {
        /* ignore */
      }
    }, 550)
    return () => clearTimeout(t)
  }, [isRealRoom, grabbleRoomCode, grabblePlayerId, state.fareMonState, serverRoom?.status, onServerRoomUpdate])

  useEffect(() => {
    if (!faremonRoomId || matchSessionId || grabbleRoomCode) return
    let cancelled = false
    const tick = async () => {
      try {
        const r = await fetch(`/api/faremon-room/${faremonRoomId}`)
        if (!r.ok || cancelled) return
        const j = await r.json()
        if (j.version <= remoteVersion.current) return
        remoteVersion.current = j.version
        applyingRemote.current = true
        const fs = j.fareMonState as FareMonBattleState
        setState((prev) => ({
          ...prev,
          fareMonState: fs,
          selectedGame: 'faremon-duel',
          winner: fs.winner,
          currentScreen: fs.gameOver
            ? 'results'
            : fs.phase === 'battle'
              ? 'faremon-battle'
              : 'faremon-type-selection',
        }))
        queueMicrotask(() => {
          applyingRemote.current = false
        })
      } catch {
        /* network */
      }
    }
    tick()
    const id = setInterval(tick, 800)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [faremonRoomId, matchSessionId, grabbleRoomCode])

  useEffect(() => {
    if (!faremonRoomId || matchSessionId || grabbleRoomCode || applyingRemote.current) return
    const fs = state.fareMonState
    if (!fs) return
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/faremon-room/${faremonRoomId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fareMonState: fs }),
        })
        if (r.ok) {
          const j = await r.json()
          remoteVersion.current = j.version
        }
      } catch {
        /* ignore */
      }
    }, 500)
    return () => clearTimeout(t)
  }, [state.fareMonState, faremonRoomId, matchSessionId, grabbleRoomCode])

  useEffect(() => {
    if (!matchSessionId || !matchRole || grabbleRoomCode) return
    let cancelled = false
    const tick = async () => {
      try {
        const r = await fetch(`/api/match/${matchSessionId}`)
        if (!r.ok || cancelled) return
        const j = (await r.json()) as {
          version: number
          gameData: { faremon?: FareMonBattleState; battleship?: BattleRouteState }
          winner: 1 | 2 | null
          gameStatus: string
        }
        if (j.version <= remoteVersion.current) return
        remoteVersion.current = j.version
        applyingRemote.current = true
        setState((prev) => {
          const next = { ...prev }
          if (matchGame === 'faremon' && j.gameData?.faremon) {
            const fs = j.gameData.faremon
            next.fareMonState = fs
            next.selectedGame = 'faremon-duel'
            next.winner = j.winner ?? fs.winner
            next.currentScreen = fs.gameOver
              ? 'results'
              : fs.phase === 'battle'
                ? 'faremon-battle'
                : 'faremon-type-selection'
          }
          if (matchGame === 'battleship' && j.gameData?.battleship) {
            const br = j.gameData.battleship
            next.battleRouteState = br
            next.selectedGame = 'battleroute'
            next.winner = j.winner ?? br.winner
            next.currentScreen = br.gameOver ? 'results' : 'battleroute'
          }
          return next
        })
        queueMicrotask(() => {
          applyingRemote.current = false
        })
      } catch {
        /* network */
      }
    }
    tick()
    const id = setInterval(tick, 800)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [matchSessionId, matchRole, matchGame])

  useEffect(() => {
    if (!matchSessionId || !matchRole || grabbleRoomCode || applyingRemote.current) return
    const clientId = getMatchClientId()
    const fs = state.fareMonState
    const br = state.battleRouteState
    if (matchGame === 'faremon' && !fs) return
    if (matchGame === 'battleship' && !br) return

    const t = setTimeout(async () => {
      try {
        const patch: {
          gameData: Partial<{ faremon: FareMonBattleState; battleship: BattleRouteState }>
          winner?: 1 | 2 | null
          gameStatus?: 'playing' | 'finished'
        } = { gameData: {} }
        if (matchGame === 'faremon' && fs) {
          patch.gameData.faremon = fs
          patch.winner = fs.winner
          patch.gameStatus = fs.gameOver ? 'finished' : 'playing'
        }
        if (matchGame === 'battleship' && br) {
          patch.gameData.battleship = br
          patch.winner = br.winner
          patch.gameStatus = br.gameOver ? 'finished' : 'playing'
        }

        const r = await fetch(`/api/match/${matchSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync',
            role: matchRole,
            clientId,
            expectedVersion: remoteVersion.current,
            patch,
          }),
        })
        if (r.status === 409) {
          const body = (await r.json()) as {
            session: {
              version: number
              gameData: {
                faremon?: FareMonBattleState
                battleship?: BattleRouteState
              }
              winner: 1 | 2 | null
            }
          }
          remoteVersion.current = body.session.version
          applyingRemote.current = true
          setState((prev) => {
            const u = { ...prev }
            if (matchGame === 'faremon' && body.session.gameData?.faremon) {
              const g = body.session.gameData.faremon
              u.fareMonState = g
              u.winner = body.session.winner ?? g.winner
              u.currentScreen = g.gameOver
                ? 'results'
                : g.phase === 'battle'
                  ? 'faremon-battle'
                  : 'faremon-type-selection'
            }
            if (matchGame === 'battleship' && body.session.gameData?.battleship) {
              const g = body.session.gameData.battleship
              u.battleRouteState = g
              u.winner = body.session.winner ?? g.winner
              u.currentScreen = g.gameOver ? 'results' : 'battleroute'
            }
            return u
          })
          queueMicrotask(() => {
            applyingRemote.current = false
          })
          return
        }
        if (r.ok) {
          const j = (await r.json()) as { version: number }
          remoteVersion.current = j.version
        }
      } catch {
        /* ignore */
      }
    }, 500)
    return () => clearTimeout(t)
  }, [
    state.fareMonState,
    state.battleRouteState,
    matchSessionId,
    matchRole,
    matchGame,
  ])

  useEffect(() => {
    if (!matchSessionId || !matchRole || !matchGame || grabbleRoomCode) return
    if (matchRole !== 1) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`/api/match/${matchSessionId}`)
        if (!r.ok || cancelled) return
        const j = (await r.json()) as {
          version: number
          gameData: { faremon?: FareMonBattleState; battleship?: BattleRouteState }
        }
        const clientId = getMatchClientId()
        if (matchGame === 'faremon' && !j.gameData?.faremon) {
          const initial = createInitialFareMonBattleState()
          const pr = await fetch(`/api/match/${matchSessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync',
              role: 1,
              clientId,
              expectedVersion: j.version,
              patch: {
                gameData: { faremon: initial },
                gameStatus: 'playing',
              },
            }),
          })
          if (pr.ok) {
            const out = (await pr.json()) as { version: number }
            remoteVersion.current = out.version
          }
        } else if (matchGame === 'battleship' && !j.gameData?.battleship) {
          const initial = createBattleRouteState()
          const pr = await fetch(`/api/match/${matchSessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync',
              role: 1,
              clientId,
              expectedVersion: j.version,
              patch: {
                gameData: { battleship: initial },
                gameStatus: 'playing',
              },
            }),
          })
          if (pr.ok) {
            const out = (await pr.json()) as { version: number }
            remoteVersion.current = out.version
          }
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [matchSessionId, matchRole, matchGame])

  useEffect(() => {
    if (!matchSessionId || !matchRole || grabbleRoomCode) return
    const clientId = getMatchClientId()
    const onHide = () => {
      void fetch(`/api/match/${matchSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          role: matchRole,
          clientId,
        }),
        keepalive: true,
      })
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [matchSessionId, matchRole])

  const setScreen = useCallback((screen: ExtendedScreen) => {
    setState((prev) => ({ ...prev, currentScreen: screen }))
  }, [])

  const resetDemo = useCallback(() => {
    remoteVersion.current = 0
    setState({ ...initialState })
    if (matchSessionId) {
      router.replace('/')
    } else if (grabbleRoomCode) {
      router.replace('/')
    } else {
      router.replace(pathname ?? '/')
    }
  }, [router, pathname, matchSessionId, grabbleRoomCode])

  const shareBattleLink = useCallback(() => {
    router.push('/room/create')
  }, [router])

  const startRealRoomFareMonSelection = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      selectedGame: 'faremon-duel',
      currentScreen: 'faremon-type-selection',
      fareMonState: prev.fareMonState ?? createInitialFareMonBattleState(),
    }))
    if (!isRealRoom || !grabbleRoomCode || !grabblePlayerId) return
    try {
      const r = await fetch(`/api/room/${grabbleRoomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          playerId: grabblePlayerId,
          patch: { status: 'faremon-type-selection' },
        }),
      })
      if (r.ok || r.status === 409) {
        const j = (await r.json()) as { room: GrabbleRoom }
        onServerRoomUpdate?.(j.room)
        remoteVersion.current = j.room.version
      }
    } catch {
      /* local screen already moved; polling will catch up */
    }
  }, [isRealRoom, grabbleRoomCode, grabblePlayerId, onServerRoomUpdate])

  useEffect(() => {
    if (isRealRoom && state.currentScreen === 'matchmaking') {
      void startRealRoomFareMonSelection()
    }
  }, [isRealRoom, state.currentScreen, startRealRoomFareMonSelection])

  // Ride option selection - mutually exclusive
  const handleSelectRideOption = useCallback((option: RideOptionId) => {
    setState((prev) => ({ ...prev, selectedRideOption: option }))
  }, [])

  // FareMon type selection
  const handleSelectType = useCallback((playerId: 1 | 2, type: FareMonType) => {
    const fs = stateRef.current.fareMonState
    const nextFs = fs ? selectType(fs, playerId, type) : null
    setState((prev) => {
      if (!prev.fareMonState) return prev
      return { ...prev, fareMonState: selectType(prev.fareMonState, playerId, type) }
    })
    if (isRealRoom && nextFs && grabbleRoomCode && grabblePlayerId) {
      const team = playerId === 1 ? nextFs.player1Team : nextFs.player2Team
      void fetch(`/api/room/${grabbleRoomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'faremon-types',
          playerId: grabblePlayerId,
          selectedTypes: team.selectedTypes,
          locked: team.locked,
        }),
      })
    }
  }, [isRealRoom, grabbleRoomCode, grabblePlayerId])

  // FareMon lock in team — async AI + optional sprite generation
  const handleLockInTeam = useCallback(
    async (playerId: 1 | 2) => {
      if (isRealRoom) {
        const fs = stateRef.current.fareMonState
        if (!fs) return
        const selectedTypes = playerId === 1 ? fs.player1Team.selectedTypes : fs.player2Team.selectedTypes
        if (selectedTypes.length !== 2) return
        setState((prev) => {
          if (!prev.fareMonState) return prev
          const next = structuredClone(prev.fareMonState)
          const team = playerId === 1 ? next.player1Team : next.player2Team
          if (team.selectedTypes.length !== 2 || team.locked) return prev
          team.locked = true
          if (playerId === 1) next.player1Team = team
          else next.player2Team = team
          return { ...prev, fareMonState: next }
        })
        if (grabbleRoomCode && grabblePlayerId) {
          try {
            const r = await fetch(`/api/room/${grabbleRoomCode}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'faremon-types',
                playerId: grabblePlayerId,
                selectedTypes,
                locked: true,
              }),
            })
            if (r.ok || r.status === 409) {
              const j = (await r.json()) as { room: GrabbleRoom }
              onServerRoomUpdate?.(j.room)
              remoteVersion.current = j.room.version
            }
          } catch {
            toast.error('Could not lock in. Try once more.')
          }
        }
        return
      }
      const fs = stateRef.current.fareMonState
      if (!fs) return
      const team = playerId === 1 ? fs.player1Team : fs.player2Team
      if (team.selectedTypes.length !== 2 || team.locked) return

      const selectedTypes = team.selectedTypes as [FareMonType, FareMonType]
      setFareMonGenerating((g) => ({ ...g, [playerId]: true }))

      try {
        const player = playerId === 1 ? defaultPlayer1 : defaultPlayer2
        const matchSeed =
          matchSessionId ??
          faremonRoomId ??
          `local-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`

        const res = await fetch('/api/ai/generate-faremon-team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: playerId === 1 ? 'player1' : 'player2',
            selectedTypes,
            routeContext: {
              pickup: player.pickup,
              destination: player.destination,
              normalFare: player.normalFare,
              timeOfDay: 'peak hour',
              weather: 'rainy',
              city: 'Singapore',
            },
            matchSeed,
          }),
        })

        if (!res.ok) {
          const t = await res.text()
          toast.error('FareMon generation failed', { description: t || res.statusText })
          return
        }

        const data = (await res.json()) as { faremons: [FareMon, FareMon] }
        let pair = data.faremons
        pair = await attachFaremonSprites(pair)

        setState((prev) => {
          const cur = prev.fareMonState
          if (!cur) return prev
          const next = applyGeneratedFareMonTeam(cur, playerId, pair)
          const screen: ExtendedScreen =
            next.phase === 'battle' ? 'faremon-battle' : prev.currentScreen
          return { ...prev, fareMonState: next, currentScreen: screen }
        })
      } catch (e) {
        toast.error('Could not generate team', {
          description: e instanceof Error ? e.message : 'Network error',
        })
      } finally {
        setFareMonGenerating((g) => {
          const n = { ...g }
          delete n[playerId]
          return n
        })
      }
    },
    [faremonRoomId, matchSessionId, isRealRoom, grabbleRoomCode, grabblePlayerId, onServerRoomUpdate],
  )

  const submitRealRoomBattleAction = useCallback(
    async (battleAction: 'move' | 'switch', move?: FareMonMove | null) => {
      if (!isRealRoom || !grabbleRoomCode || !grabblePlayerId) return
      try {
        const r = await fetch(`/api/room/${grabbleRoomCode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'faremon-action',
            playerId: grabblePlayerId,
            battleAction,
            move: battleAction === 'move' ? move : null,
          }),
        })
        if (r.ok || r.status === 409) {
          const j = (await r.json()) as { room: GrabbleRoom }
          onServerRoomUpdate?.(j.room)
          remoteVersion.current = j.room.version
        }
      } catch {
        toast.error('Move did not sync. Tap again.')
      }
    },
    [isRealRoom, grabbleRoomCode, grabblePlayerId, onServerRoomUpdate],
  )

  // FareMon move selection
  const handleFareMonMove = useCallback(
    (playerId: 1 | 2, move: FareMonMove) => {
      setState((prev) => {
        if (!prev.fareMonState) return prev

        let newState = { ...prev.fareMonState }

        if (playerId === 1) {
          newState.player1SelectedMove = move
          newState.player1Action = 'move'
          newState.player1Locked = true
        } else {
          newState.player2SelectedMove = move
          newState.player2Action = 'move'
          newState.player2Locked = true
        }

        if (newState.player1Locked && newState.player2Locked) {
          if (!isRealRoom) {
            newState = resolveFareMonTurn(newState)
            if (newState.gameOver) {
              return {
                ...prev,
                fareMonState: newState,
                winner: newState.winner,
                currentScreen: 'results',
              }
            }
          }
        }

        return { ...prev, fareMonState: newState }
      })
      if (isRealRoom) void submitRealRoomBattleAction('move', move)
    },
    [isRealRoom, submitRealRoomBattleAction],
  )

  // FareMon switch
  const handleFareMonSwitch = useCallback(
    (playerId: 1 | 2) => {
      setState((prev) => {
        if (!prev.fareMonState) return prev

        let newState = { ...prev.fareMonState }

        if (playerId === 1) {
          newState.player1Action = 'switch'
          newState.player1SelectedMove = null
          newState.player1Locked = true
        } else {
          newState.player2Action = 'switch'
          newState.player2SelectedMove = null
          newState.player2Locked = true
        }

        if (newState.player1Locked && newState.player2Locked) {
          if (!isRealRoom) {
            newState = resolveFareMonTurn(newState)

            if (newState.gameOver) {
              return {
                ...prev,
                fareMonState: newState,
                winner: newState.winner,
                currentScreen: 'results',
              }
            }
          }
        }

        return { ...prev, fareMonState: newState }
      })
      if (isRealRoom) void submitRealRoomBattleAction('switch')
    },
    [isRealRoom, submitRealRoomBattleAction],
  )

  // BattleRoute path selection
  const handleBattleRoutePath = useCallback((playerId: 1 | 2, encodedAction: number) => {
    setState((prev) => {
      if (!prev.battleRouteState) return prev
      if (
        (matchSessionId || isRealRoom) &&
        prev.battleRouteState.phase === 'attack' &&
        prev.battleRouteState.currentTurn !== playerId
      ) {
        return prev
      }

      let newState = { ...prev.battleRouteState }
      
      if (encodedAction >= 1000) {
        const decoded = encodedAction - 1000
        const row = Math.floor(decoded / 10)
        const col = decoded % 10
        newState = submitRouteAttack(newState, playerId, row, col)
      } else {
        const row = Math.floor(encodedAction / 100)
        const col = Math.floor((encodedAction % 100) / 10)
        const isHorizontal = (encodedAction % 10) === 1
        
        const playerKey = playerId === 1 ? 'player1' : 'player2'
        const placedIds = newState[playerKey].placedAssets.map(p => p.asset.id)
        const nextAsset = routeAssets.find(a => !placedIds.includes(a.id))
        
        if (nextAsset) {
          newState = placeRouteAsset(newState, playerId, nextAsset, row, col, isHorizontal)
        }
      }
      
      if (newState.gameOver) {
        return {
          ...prev,
          battleRouteState: newState,
          winner: newState.winner,
          currentScreen: 'results',
        }
      }
      
      return { ...prev, battleRouteState: newState }
    })
  }, [matchSessionId, isRealRoom])

  const renderScreen = (playerId: 1 | 2) => {
    const player = playerId === 1 ? defaultPlayer1 : defaultPlayer2
    const opponent = playerId === 1 ? defaultPlayer2 : defaultPlayer1

    if (isRealRoom && serverRoom?.status === 'faremon-battle' && !state.fareMonState) {
      return (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm font-medium text-white/90">Loading battle…</p>
          <p className="text-xs text-white/55">Syncing room state</p>
        </div>
      )
    }
    if (matchSessionId && matchGame === 'faremon' && !state.fareMonState) {
      return (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm font-medium text-white/90">Syncing Faremon…</p>
          <p className="text-xs text-white/55">Waiting for battle data from host</p>
        </div>
      )
    }
    if (matchSessionId && matchGame === 'battleship' && !state.battleRouteState) {
      return (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm font-medium text-white/90">Syncing Battleship…</p>
          <p className="text-xs text-white/55">Waiting for battle data from host</p>
        </div>
      )
    }
    switch (state.currentScreen) {
      case 'ride-options':
        return (
          <RideOptionsScreen
            player={player}
            selectedRideOption={state.selectedRideOption}
            onSelectRideOption={handleSelectRideOption}
            onStartGrabble={() => {
              if (isRealRoom) void startRealRoomFareMonSelection()
              else setScreen('grabble-optin')
            }}
            onBookRide={() => setScreen('booking-confirmation')}
            onBack={resetDemo}
          />
        )
      
      case 'grabble-optin':
        return (
          <GrabbleOptInScreen
            player={player}
            onAccept={() => {
              if (isRealRoom) void startRealRoomFareMonSelection()
              else setScreen('matchmaking')
            }}
            onDecline={() => setScreen('ride-options')}
          />
        )
      
      case 'matchmaking':
        return (
          <MatchmakingScreen
            player={player}
            opponent={opponent}
            matchedSimilarity={99}
            onMatched={async () => {
              if (isRealRoom && grabbleRoomCode && grabblePlayerId && state.fareMonState) {
                const r = await fetch(`/api/room/${grabbleRoomCode}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'sync',
                    playerId: grabblePlayerId,
                    patch: { status: 'faremon-type-selection' },
                  }),
                })
                if (r.ok) {
                  const j = (await r.json()) as { room: GrabbleRoom }
                  onServerRoomUpdate?.(j.room)
                }
              }
              setState((prev) => ({
                ...prev,
                selectedGame: 'faremon-duel',
                currentScreen: 'faremon-type-selection',
                fareMonState: isRealRoom ? (prev.fareMonState ?? createInitialFareMonBattleState()) : createInitialFareMonBattleState(),
              }))
            }}
          />
        )

      case 'faremon-type-selection':
        if (!state.fareMonState) return null
        return (
          <div className="relative flex h-full min-h-0 flex-col">
            {serverRoom?.faremonGenerating && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[inherit] bg-black/65 px-4">
                <p className="text-center text-sm font-semibold text-white">
                  {serverRoom.status === 'faremon-generating-images'
                    ? 'Generating battle stage…'
                    : 'Generating teams…'}
                </p>
                <p className="mt-1 text-center text-xs text-white/60">
                  {serverRoom.status === 'faremon-generating-images'
                    ? 'Generating FareMon sprites… Preparing synced battle view…'
                    : 'Hang tight — one server run for both players'}
                </p>
              </div>
            )}
            {state.fareMonState?.imageGenerationError && (
              <div className="absolute inset-x-2 top-2 z-40 rounded-xl border border-red-400/40 bg-red-950/80 p-3 text-center text-xs text-red-100">
                {state.fareMonState.imageGenerationError}
              </div>
            )}
            <FareMonTypeSelectionScreen
              playerId={playerId}
              team={playerId === 1 ? state.fareMonState.player1Team : state.fareMonState.player2Team}
              opponentLocked={
                playerId === 1 ? state.fareMonState.player2Team.locked : state.fareMonState.player1Team.locked
              }
              isGenerating={!!fareMonGenerating[playerId]}
              onSelectType={(type) => handleSelectType(playerId, type)}
              onLockIn={() => handleLockInTeam(playerId)}
            />
          </div>
        )

      case 'faremon-battle':
        if (!state.fareMonState) return null
        return (
          <FareMonBattleScreen
            playerId={playerId}
            state={state.fareMonState}
            onSelectMove={(move) => handleFareMonMove(playerId, move)}
            onSwitch={() => handleFareMonSwitch(playerId)}
            requireGeneratedImages={false}
            waitingForOpponent={
              playerId === 1 
                ? state.fareMonState.player1Locked && !state.fareMonState.player2Locked
                : state.fareMonState.player2Locked && !state.fareMonState.player1Locked
            }
          />
        )
      
      case 'battleroute':
        if (!state.battleRouteState) return null
        return (
          <div className="flex h-full min-h-0 flex-col">
            {compactChrome && (
              <div
                className={`mb-2 shrink-0 rounded-lg px-2 py-1.5 text-center text-xs font-semibold ${
                  state.battleRouteState.currentTurn === playerId
                    ? 'bg-[#00b14f]/25 text-[#7dffb2]'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {state.battleRouteState.currentTurn === playerId
                  ? 'Your turn'
                  : "Opponent's turn"}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-hidden">
              <BattleRouteScreen
                playerId={playerId}
                state={state.battleRouteState}
                onSelectPath={(pathIndex) => handleBattleRoutePath(playerId, pathIndex)}
              />
            </div>
          </div>
        )
      
      case 'results':
        if (!state.winner || !state.selectedGame) return null
        return (
          <ResultsScreen
            playerId={playerId}
            player={player}
            opponent={opponent}
            winner={state.winner}
            gameType={state.selectedGame}
            onContinue={() => setScreen('booking-confirmation')}
          />
        )
      
      case 'booking-confirmation':
        return (
          <BookingConfirmationScreen
            player={player}
            isWinner={playerId === state.winner}
            onReset={resetDemo}
          />
        )
      
      default:
        return null
    }
  }

  const remotePlayAs = faremonRemoteRole ?? matchRole ?? resolvedRole
  const compactChrome = Boolean(matchSessionId || isRealRoom)

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] ${compactChrome ? 'p-4 md:p-6' : 'p-8'}`}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center ${compactChrome ? 'mb-4' : 'mb-8'}`}
      >
        <div className="mb-2 flex items-center justify-center gap-3">
          <svg className="w-10 h-10 text-[#00b14f]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="20" cy="20" r="15" />
            <path d="M13 20h14M20 13v14" strokeLinecap="round" />
            <circle cx="13" cy="20" r="3" fill="currentColor" stroke="none" />
            <circle cx="27" cy="20" r="3" fill="currentColor" stroke="none" />
          </svg>
          <h1 className={`font-bold text-white ${compactChrome ? 'text-2xl' : 'text-4xl'}`}>
            Grabble Demo
          </h1>
        </div>
        {!compactChrome && (
          <p className="text-lg text-white/70">
            Competitive Ridehailing: Compete to pay half the price or walk away with 1.5x
          </p>
        )}
        {(matchSessionId || isRealRoom) && remotePlayAs && (
          <p className="text-sm font-medium text-[#7dffb2]">
            {remotePlayAs === 1 ? 'Player 1 · Ride Challenger' : 'Player 2 · Fare Opponent'} · Live match
          </p>
        )}

        {!compactChrome && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={shareBattleLink}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#00b14f]/20 px-4 py-2 text-sm font-medium text-[#7dffb2] transition-colors hover:bg-[#00b14f]/30"
          >
            <Link2 className="h-4 w-4" />
            Share Battle Link
          </motion.button>
        )}

        {/* Reset button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resetDemo}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
        >
          <RotateCcw className="h-4 w-4" />
          {isRealRoom ? 'Back to solo / local demo' : compactChrome ? 'Exit match' : 'Reset Demo'}
        </motion.button>
      </motion.div>

      {/* Phones */}
      <div className="flex flex-wrap items-start justify-center gap-8">
        {singleRemote && remotePlayAs ? (
          <PhoneFrame
            playerName={remotePlayAs === 1 ? defaultPlayer1.name : defaultPlayer2.name}
            playerId={remotePlayAs}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={state.currentScreen}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="h-full min-h-0"
              >
                {renderScreen(remotePlayAs)}
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>
        ) : (
          <>
            <PhoneFrame playerName={defaultPlayer1.name} playerId={1}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.currentScreen}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full min-h-0"
                >
                  {renderScreen(1)}
                </motion.div>
              </AnimatePresence>
            </PhoneFrame>
            <PhoneFrame playerName={defaultPlayer2.name} playerId={2}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.currentScreen}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full min-h-0"
                >
                  {renderScreen(2)}
                </motion.div>
              </AnimatePresence>
            </PhoneFrame>
          </>
        )}
      </div>
      
      {/* Footer info */}
      {!compactChrome && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-6 rounded-2xl bg-white/5 px-6 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#00b14f]" />
            <span className="text-sm text-white/70">Player 1: {defaultPlayer1.name}</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#ff6b00]" />
            <span className="text-sm text-white/70">Player 2: {defaultPlayer2.name}</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Sparkles className="w-4 h-4 text-[#00b14f]" />
            </motion.div>
            <span className="text-sm text-white/70">AI-powered matching</span>
          </div>
        </div>
        
        {/* Current screen indicator */}
        <p className="mt-4 text-xs text-white/40">
          Current screen: <span className="text-white/60 font-medium">{state.currentScreen}</span>
          {state.selectedGame && (
            <span className="ml-2">| Game: <span className="text-[#00b14f] font-medium">{state.selectedGame}</span></span>
          )}
        </p>
      </motion.div>
      )}
    </div>
  )
}
