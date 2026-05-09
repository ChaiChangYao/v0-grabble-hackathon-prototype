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
import { FareBlocksScreen } from './screens/fare-blocks-screen'
import { ResultsScreen } from './screens/results-screen'
import { BookingConfirmationScreen } from './screens/booking-confirmation-screen'
import {
  Screen,
  GameType,
  GameState,
  FareMonMove,
  BlockPiece,
  defaultPlayer1,
  defaultPlayer2,
} from '@/lib/grabble-types'
import {
  createInitialFareMonState,
  createInitialFareBlocksState,
  resolveFareMonTurn,
  placePiece,
  clearCompletedLines,
  calculateFareBlocksScore,
  updateSurgePressure,
  determineFareBlocksWinner,
  generateFareBlocksAIHint,
  canPlacePiece,
} from '@/lib/game-engine'

const initialState: GameState = {
  currentScreen: 'home',
  selectedRideOption: null,
  player1: defaultPlayer1,
  player2: defaultPlayer2,
  matchedFareSimilarity: 99,
  selectedGame: null,
  fareMonState: null,
  fareBlocksState: null,
  winner: null,
  aiCommentary: [],
}

export function GrabbleDemo() {
  const [state, setState] = useState<GameState>(initialState)

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
      fareBlocksState: game === 'fare-blocks' ? createInitialFareBlocksState() : null,
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

  const handleFareBlocksPlace = useCallback((playerId: 1 | 2, piece: BlockPiece, row: number, col: number) => {
    setState((prev) => {
      if (!prev.fareBlocksState) return prev
      
      const newState = { ...prev.fareBlocksState }
      const playerKey = playerId === 1 ? 'player1' : 'player2'
      const playerState = { ...newState[playerKey] }
      
      // Check if placement is valid
      if (!canPlacePiece(playerState.grid, piece, row, col)) {
        // Invalid placement - increase surge pressure
        playerState.surgePressure = updateSurgePressure(
          playerState.surgePressure,
          false,
          0,
          0,
          newState.modifier.name
        )
        newState[playerKey] = playerState
        return { ...prev, fareBlocksState: newState }
      }
      
      // Place the piece
      const newGrid = placePiece(playerState.grid, piece, row, col)
      
      // Clear completed lines
      const { grid: clearedGrid, rowsCleared, colsCleared } = clearCompletedLines(newGrid)
      
      // Calculate score
      const points = calculateFareBlocksScore(piece, rowsCleared, colsCleared, newState.modifier.name)
      
      // Update player state
      playerState.grid = clearedGrid
      playerState.score += points
      playerState.movesRemaining -= 1
      playerState.surgePressure = updateSurgePressure(
        playerState.surgePressure,
        true,
        rowsCleared,
        colsCleared,
        newState.modifier.name
      )
      
      newState[playerKey] = playerState
      newState.aiHint = generateFareBlocksAIHint()
      newState.currentPieceIndex = (newState.currentPieceIndex + 1) % 7
      
      // Check if game is over (both players have no moves remaining)
      if (newState.player1.movesRemaining === 0 && newState.player2.movesRemaining === 0) {
        newState.gameOver = true
        newState.winner = determineFareBlocksWinner(newState)
        
        return {
          ...prev,
          fareBlocksState: newState,
          winner: newState.winner,
          currentScreen: 'results',
        }
      }
      
      return { ...prev, fareBlocksState: newState }
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
      
      case 'fare-blocks':
        if (!state.fareBlocksState) return null
        return (
          <FareBlocksScreen
            playerId={playerId}
            state={state.fareBlocksState}
            onPlacePiece={(piece, row, col) => handleFareBlocksPlace(playerId, piece, row, col)}
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
          <span className="text-4xl">⚔️</span>
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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Demo
        </motion.button>
      </motion.div>
      
      {/* Phones */}
      <div className="flex flex-wrap items-start justify-center gap-8">
        <AnimatePresence mode="wait">
          <PhoneFrame key="player1" playerName={state.player1.name} playerId={1}>
            {renderScreen(1)}
          </PhoneFrame>
          <PhoneFrame key="player2" playerName={state.player2.name} playerId={2}>
            {renderScreen(2)}
          </PhoneFrame>
        </AnimatePresence>
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
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              ✨
            </motion.span>
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
