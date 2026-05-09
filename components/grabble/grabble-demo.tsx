'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  createInitialFareMonBattleState,
  selectType,
  lockInTeam,
  resolveFareMonTurn,
} from '@/lib/faremon-engine'
import {
  createBattleRouteState,
  placeRouteAsset,
  submitRouteAttack,
  routeAssets,
  type BattleRouteState,
} from '@/lib/battleroute-engine'
import { RotateCcw, Sparkles, Link2 } from 'lucide-react'

type RideOptionId = 'grabble' | 'justgrab' | 'metered-taxi' | 'car-only'

type ExtendedScreen = Screen | 'faremon-type-selection' | 'faremon-battle'

export interface GrabbleDemoProps {
  faremonRoomId?: string
  /** When set with faremonRoomId, only one phone frame is shown for online play */
  faremonRemoteRole?: 1 | 2
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

export function GrabbleDemo(props: GrabbleDemoProps = {}) {
  const { faremonRoomId, faremonRemoteRole } = props
  const [state, setState] = useState<GameState>(initialState)
  const remoteVersion = useRef(0)
  const applyingRemote = useRef(false)
  const singleRemote = Boolean(faremonRoomId && faremonRemoteRole)

  useEffect(() => {
    if (!faremonRoomId) return
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
  }, [faremonRoomId])

  useEffect(() => {
    if (!faremonRoomId || applyingRemote.current) return
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
  }, [state.fareMonState, faremonRoomId])

  const setScreen = useCallback((screen: ExtendedScreen) => {
    setState((prev) => ({ ...prev, currentScreen: screen }))
  }, [])

  const resetDemo = useCallback(() => {
    remoteVersion.current = 0
    setState(initialState)
  }, [])

  const shareFaremonRoom = useCallback(async () => {
    try {
      const r = await fetch('/api/faremon-room', { method: 'POST' })
      const j = (await r.json()) as { roomId: string; guestUrlHint?: string }
      const base =
        typeof window !== 'undefined' ? window.location.origin : ''
      const host = `${base}/?faremonRoom=${j.roomId}&role=1`
      const guest = j.guestUrlHint || `${base}/?faremonRoom=${j.roomId}&role=2`
      const text = `FareMon online duel\nYou (host): ${host}\nFriend (guest): ${guest}`
      await navigator.clipboard.writeText(text)
    } catch {
      /* clipboard / fetch */
    }
  }, [])

  // Ride option selection - mutually exclusive
  const handleSelectRideOption = useCallback((option: RideOptionId) => {
    setState((prev) => ({ ...prev, selectedRideOption: option }))
  }, [])

  // FareMon type selection
  const handleSelectType = useCallback((playerId: 1 | 2, type: FareMonType) => {
    setState((prev) => {
      if (!prev.fareMonState) return prev
      const newState = selectType(prev.fareMonState, playerId, type)
      return { ...prev, fareMonState: newState }
    })
  }, [])

  // FareMon lock in team
  const handleLockInTeam = useCallback((playerId: 1 | 2) => {
    setState((prev) => {
      if (!prev.fareMonState) return prev
      const newState = lockInTeam(prev.fareMonState, playerId)
      
      // Check if both locked - transition to battle
      if (newState.phase === 'battle') {
        return { 
          ...prev, 
          fareMonState: newState,
          currentScreen: 'faremon-battle',
        }
      }
      
      return { ...prev, fareMonState: newState }
    })
  }, [])

  // FareMon move selection
  const handleFareMonMove = useCallback((playerId: 1 | 2, move: FareMonMove) => {
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
      
      // If both players have locked in, resolve the turn
      if (newState.player1Locked && newState.player2Locked) {
        newState = resolveFareMonTurn(newState)
        
        // Check if game is over
        if (newState.gameOver) {
          return {
            ...prev,
            fareMonState: newState,
            winner: newState.winner,
            currentScreen: 'results',
          }
        }
      }
      
      return { ...prev, fareMonState: newState }
    })
  }, [])

  // FareMon switch
  const handleFareMonSwitch = useCallback((playerId: 1 | 2) => {
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
      
      // If both players have locked in, resolve the turn
      if (newState.player1Locked && newState.player2Locked) {
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
      
      return { ...prev, fareMonState: newState }
    })
  }, [])

  // BattleRoute path selection
  const handleBattleRoutePath = useCallback((playerId: 1 | 2, encodedAction: number) => {
    setState((prev) => {
      if (!prev.battleRouteState) return prev
      
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
  }, [])

  const renderScreen = (playerId: 1 | 2) => {
    const player = playerId === 1 ? defaultPlayer1 : defaultPlayer2
    const opponent = playerId === 1 ? defaultPlayer2 : defaultPlayer1
    
    switch (state.currentScreen) {
      case 'ride-options':
        return (
          <RideOptionsScreen
            player={player}
            selectedRideOption={state.selectedRideOption}
            onSelectRideOption={handleSelectRideOption}
            onStartGrabble={() => setScreen('grabble-optin')}
            onBookRide={() => setScreen('booking-confirmation')}
            onBack={resetDemo}
          />
        )
      
      case 'grabble-optin':
        return (
          <GrabbleOptInScreen
            player={player}
            onAccept={() => setScreen('matchmaking')}
            onDecline={() => setScreen('ride-options')}
          />
        )
      
      case 'matchmaking':
        return (
          <MatchmakingScreen
            player={player}
            opponent={opponent}
            matchedSimilarity={99}
            onMatched={() => {
              setState((prev) => ({
                ...prev,
                selectedGame: 'faremon-duel',
                currentScreen: 'faremon-type-selection',
                fareMonState: createInitialFareMonBattleState(),
              }))
            }}
          />
        )

      case 'faremon-type-selection':
        if (!state.fareMonState) return null
        return (
          <FareMonTypeSelectionScreen
            playerId={playerId}
            team={playerId === 1 ? state.fareMonState.player1Team : state.fareMonState.player2Team}
            opponentLocked={playerId === 1 ? state.fareMonState.player2Team.locked : state.fareMonState.player1Team.locked}
            onSelectType={(type) => handleSelectType(playerId, type)}
            onLockIn={() => handleLockInTeam(playerId)}
          />
        )
      
      case 'faremon-battle':
        if (!state.fareMonState) return null
        return (
          <FareMonBattleScreen
            playerId={playerId}
            state={state.fareMonState}
            onSelectMove={(move) => handleFareMonMove(playerId, move)}
            onSwitch={() => handleFareMonSwitch(playerId)}
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
          <BattleRouteScreen
            playerId={playerId}
            state={state.battleRouteState}
            onSelectPath={(pathIndex) => handleBattleRoutePath(playerId, pathIndex)}
          />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-2 flex items-center justify-center gap-3">
          <svg className="w-10 h-10 text-[#00b14f]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="20" cy="20" r="15" />
            <path d="M13 20h14M20 13v14" strokeLinecap="round" />
            <circle cx="13" cy="20" r="3" fill="currentColor" stroke="none" />
            <circle cx="27" cy="20" r="3" fill="currentColor" stroke="none" />
          </svg>
          <h1 className="text-4xl font-bold text-white">Grabble Demo</h1>
        </div>
        <p className="text-lg text-white/70">
          Competitive Ridehailing: Compete to pay half the price or walk away with 1.5x
        </p>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={shareFaremonRoom}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#00b14f]/20 px-4 py-2 text-sm font-medium text-[#7dffb2] transition-colors hover:bg-[#00b14f]/30"
        >
          <Link2 className="h-4 w-4" />
          Copy FareMon online duel links
        </motion.button>

        {/* Reset button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resetDemo}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Demo
        </motion.button>
      </motion.div>
      
      {/* Phones */}
      <div className="flex flex-wrap items-start justify-center gap-8">
        {singleRemote && faremonRemoteRole ? (
          <PhoneFrame
            playerName={
              faremonRemoteRole === 1 ? defaultPlayer1.name : defaultPlayer2.name
            }
            playerId={faremonRemoteRole}
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
                {renderScreen(faremonRemoteRole)}
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
    </div>
  )
}
