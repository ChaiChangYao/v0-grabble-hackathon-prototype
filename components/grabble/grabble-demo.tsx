'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PhoneFrame } from './phone-frame'
import { HomeScreen } from './screens/home-screen'
import { RideOptionsScreen } from './screens/ride-options-screen'
import { GrabbleOptInScreen } from './screens/grabble-optin-screen'
import { MatchmakingScreen } from './screens/matchmaking-screen'
import { AIGameSelectionScreen } from './screens/ai-game-selection-screen'
import { FareMonDuelScreen } from './screens/faremon-duel-screen'
import { BattleRouteScreen } from './screens/battleroute-screen'
import { ResultsScreen } from './screens/results-screen'
import { BookingConfirmationScreen } from './screens/booking-confirmation-screen'
import {
  Screen,
  GameType,
  GameState,
  FareMonMove,
  defaultPlayer1,
  defaultPlayer2,
} from '@/lib/grabble-types'
import {
  createInitialFareMonState,
  resolveFareMonTurn,
} from '@/lib/game-engine'
import {
  createBattleRouteState,
  placeRouteAsset,
  submitRouteAttack,
  routeAssets,
  type BattleRouteState,
} from '@/lib/battleroute-engine'
import { RotateCcw, Sparkles } from 'lucide-react'

interface ExtendedGameState extends Omit<GameState, 'fareBlocksState'> {
  battleRouteState: BattleRouteState | null
}

const initialState: ExtendedGameState = {
  currentScreen: 'home',
  selectedRideOption: null,
  player1: defaultPlayer1,
  player2: defaultPlayer2,
  matchedFareSimilarity: 99,
  selectedGame: null,
  fareMonState: null,
  battleRouteState: null,
  winner: null,
  aiCommentary: [],
}

export function GrabbleDemo() {
  const [state, setState] = useState<ExtendedGameState>(initialState)

  const setScreen = useCallback((screen: Screen) => {
    setState((prev) => ({ ...prev, currentScreen: screen }))
  }, [])

  const resetDemo = useCallback(() => {
    setState(initialState)
  }, [])

  const handleGameSelected = useCallback((game: GameType) => {
    setState((prev) => ({
      ...prev,
      selectedGame: game,
      currentScreen: game,
      fareMonState: game === 'faremon-duel' ? createInitialFareMonState() : null,
      battleRouteState: game === 'battleroute' ? createBattleRouteState() : null,
    }))
  }, [])

  const handleFareMonMove = useCallback((playerId: 1 | 2, move: FareMonMove) => {
    setState((prev) => {
      if (!prev.fareMonState) return prev
      
      const newFareMonState = { ...prev.fareMonState }
      
      if (playerId === 1) {
        newFareMonState.player1Move = move
      } else {
        newFareMonState.player2Move = move
      }
      
      // If both players have moved, resolve the turn
      if (newFareMonState.player1Move && newFareMonState.player2Move) {
        const resolvedState = resolveFareMonTurn(newFareMonState)
        
        // Check if game is over
        if (resolvedState.gameOver) {
          return {
            ...prev,
            fareMonState: resolvedState,
            winner: resolvedState.winner,
            currentScreen: 'results',
          }
        }
        
        return { ...prev, fareMonState: resolvedState }
      }
      
      return { ...prev, fareMonState: newFareMonState }
    })
  }, [])

  const handleBattleRoutePath = useCallback((playerId: 1 | 2, encodedAction: number) => {
    setState((prev) => {
      if (!prev.battleRouteState) return prev
      
      let newState = { ...prev.battleRouteState }
      
      // Decode action: placement vs attack
      if (encodedAction >= 1000) {
        // Attack action: 1000 + row*10 + col
        const decoded = encodedAction - 1000
        const row = Math.floor(decoded / 10)
        const col = decoded % 10
        newState = submitRouteAttack(newState, playerId, row, col)
      } else {
        // Placement action: row*100 + col*10 + isHorizontal
        const row = Math.floor(encodedAction / 100)
        const col = Math.floor((encodedAction % 100) / 10)
        const isHorizontal = (encodedAction % 10) === 1
        
        // Find the next asset to place for this player
        const playerKey = playerId === 1 ? 'player1' : 'player2'
        const placedIds = newState[playerKey].placedAssets.map(p => p.asset.id)
        const nextAsset = routeAssets.find(a => !placedIds.includes(a.id))
        
        if (nextAsset) {
          newState = placeRouteAsset(newState, playerId, nextAsset, row, col, isHorizontal)
        }
      }
      
      // Check if game is over
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
    const player = playerId === 1 ? state.player1 : state.player2
    const opponent = playerId === 1 ? state.player2 : state.player1
    
    switch (state.currentScreen) {
      case 'home':
        return (
          <HomeScreen
            player={player}
            onContinue={() => setScreen('ride-options')}
          />
        )
      
      case 'ride-options':
        return (
          <RideOptionsScreen
            player={player}
            onSelectGrabble={() => setScreen('grabble-optin')}
            onBack={() => setScreen('home')}
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
            matchedSimilarity={state.matchedFareSimilarity}
            onMatched={() => setScreen('ai-game-selection')}
          />
        )
      
      case 'ai-game-selection':
        return (
          <AIGameSelectionScreen
            onGameSelected={handleGameSelected}
          />
        )
      
      case 'faremon-duel':
        if (!state.fareMonState) return null
        return (
          <FareMonDuelScreen
            playerId={playerId}
            state={state.fareMonState}
            onSelectMove={(move) => handleFareMonMove(playerId, move)}
            waitingForOpponent={
              playerId === 1 
                ? state.fareMonState.player1Move !== null && state.fareMonState.player2Move === null
                : state.fareMonState.player2Move !== null && state.fareMonState.player1Move === null
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
        if (!state.winner) return null
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
        <PhoneFrame playerName={state.player1.name} playerId={1}>
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentScreen}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderScreen(1)}
            </motion.div>
          </AnimatePresence>
        </PhoneFrame>
        <PhoneFrame playerName={state.player2.name} playerId={2}>
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentScreen}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderScreen(2)}
            </motion.div>
          </AnimatePresence>
        </PhoneFrame>
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
            <span className="text-sm text-white/70">Player 1: {state.player1.name}</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#ff6b00]" />
            <span className="text-sm text-white/70">Player 2: {state.player2.name}</span>
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
        </p>
      </motion.div>
    </div>
  )
}
