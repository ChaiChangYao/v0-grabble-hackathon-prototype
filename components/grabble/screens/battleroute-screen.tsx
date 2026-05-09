"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Player } from "@/lib/grabble-types"
import {
  BattleRouteState,
  initBattleRoute,
  claimTile,
  getValidMoves,
  checkGameEnd,
  calculateProgress,
  BOARD_SIZE,
  TileType
} from "@/lib/battleroute-engine"

interface BattleRouteScreenProps {
  player: Player
  opponent: Player
  playerId: 1 | 2
  onGameEnd: (winner: 1 | 2 | 'tie') => void
}

const TILE_COLORS: Record<TileType, { bg: string; border: string; icon: string }> = {
  empty: { bg: "bg-gray-100", border: "border-gray-200", icon: "" },
  player1: { bg: "bg-[#00b14f]", border: "border-[#00923f]", icon: "" },
  player2: { bg: "bg-[#ff6b00]", border: "border-[#e55a00]", icon: "" },
  blocked: { bg: "bg-gray-300", border: "border-gray-400", icon: "" },
  bonus: { bg: "bg-amber-100", border: "border-amber-300", icon: "+" },
  speedBoost: { bg: "bg-blue-100", border: "border-blue-300", icon: ">" },
}

export function BattleRouteScreen({ player, opponent, playerId, onGameEnd }: BattleRouteScreenProps) {
  const [gameState, setGameState] = useState<BattleRouteState>(() => initBattleRoute())
  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null)
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([])
  const [gameEnded, setGameEnded] = useState(false)
  const [turnTimer, setTurnTimer] = useState(10)

  const isMyTurn = gameState.currentTurn === playerId

  // Update valid moves when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      const moves = getValidMoves(gameState, playerId)
      setValidMoves(moves)
    } else {
      setValidMoves([])
    }
  }, [gameState.currentTurn, isMyTurn, gameEnded, gameState, playerId])

  // Turn timer
  useEffect(() => {
    if (gameEnded) return

    const interval = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          // Auto-move on timeout
          if (isMyTurn && validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]
            handleTileClick(randomMove.row, randomMove.col)
          }
          return 10
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isMyTurn, validMoves, gameEnded])

  // Reset timer on turn change
  useEffect(() => {
    setTurnTimer(10)
  }, [gameState.currentTurn])

  // Simulate opponent moves
  useEffect(() => {
    if (!isMyTurn && !gameEnded) {
      const opponentMoves = getValidMoves(gameState, playerId === 1 ? 2 : 1)
      if (opponentMoves.length > 0) {
        const timer = setTimeout(() => {
          const move = opponentMoves[Math.floor(Math.random() * opponentMoves.length)]
          const newState = claimTile(gameState, move.row, move.col, playerId === 1 ? 2 : 1)
          setGameState(newState)
          
          const result = checkGameEnd(newState)
          if (result.ended) {
            setGameEnded(true)
            setTimeout(() => onGameEnd(result.winner!), 1500)
          }
        }, 800 + Math.random() * 600)
        return () => clearTimeout(timer)
      }
    }
  }, [gameState.currentTurn, isMyTurn, gameEnded, gameState, playerId, onGameEnd])

  const handleTileClick = useCallback((row: number, col: number) => {
    if (!isMyTurn || gameEnded) return
    
    const isValid = validMoves.some(m => m.row === row && m.col === col)
    if (!isValid) return

    const newState = claimTile(gameState, row, col, playerId)
    setGameState(newState)
    setSelectedTile(null)

    const result = checkGameEnd(newState)
    if (result.ended) {
      setGameEnded(true)
      setTimeout(() => onGameEnd(result.winner!), 1500)
    }
  }, [isMyTurn, gameEnded, validMoves, gameState, playerId, onGameEnd])

  const progress = calculateProgress(gameState)
  const myProgress = playerId === 1 ? progress.player1 : progress.player2
  const opponentProgress = playerId === 1 ? progress.player2 : progress.player1

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">BattleRoute</div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              isMyTurn ? "bg-[#00b14f] text-white" : "bg-gray-200 text-gray-600"
            )}>
              {isMyTurn ? "Your Turn" : "Opponent"}
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
              {turnTimer}
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-16 text-xs font-medium text-gray-700 truncate">{player.name}</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00b14f]"
                initial={{ width: 0 }}
                animate={{ width: `${myProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="w-8 text-xs font-bold text-[#00b14f]">{Math.round(myProgress)}%</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 text-xs font-medium text-gray-700 truncate">{opponent.name}</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#ff6b00]"
                initial={{ width: 0 }}
                animate={{ width: `${opponentProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="w-8 text-xs font-bold text-[#ff6b00]">{Math.round(opponentProgress)}%</div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex items-center justify-center px-3 py-2">
        <div className="bg-white rounded-xl shadow-lg p-2 border border-gray-200">
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
          >
            {gameState.board.map((row, rowIdx) =>
              row.map((tile, colIdx) => {
                const isValidMove = validMoves.some(m => m.row === rowIdx && m.col === colIdx)
                const colors = TILE_COLORS[tile]
                const isStart = (rowIdx === 0 && colIdx === 0) || (rowIdx === BOARD_SIZE - 1 && colIdx === BOARD_SIZE - 1)
                
                return (
                  <motion.button
                    key={`${rowIdx}-${colIdx}`}
                    className={cn(
                      "w-7 h-7 rounded border-2 flex items-center justify-center text-xs font-bold transition-all",
                      colors.bg,
                      colors.border,
                      isValidMove && isMyTurn && "ring-2 ring-[#00b14f] ring-offset-1 cursor-pointer",
                      !isValidMove && "cursor-default",
                      isStart && tile === "empty" && "border-dashed"
                    )}
                    onClick={() => handleTileClick(rowIdx, colIdx)}
                    whileTap={isValidMove ? { scale: 0.9 } : {}}
                    animate={isValidMove ? { scale: [1, 1.05, 1] } : {}}
                    transition={isValidMove ? { repeat: Infinity, duration: 1.5 } : {}}
                  >
                    {tile === "player1" && (
                      <div className="w-4 h-4 rounded-full bg-white/30" />
                    )}
                    {tile === "player2" && (
                      <div className="w-4 h-4 rounded-full bg-white/30" />
                    )}
                    {colors.icon && (
                      <span className="text-amber-600">{colors.icon}</span>
                    )}
                  </motion.button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#00b14f]" />
                <span className="text-gray-600">You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#ff6b00]" />
                <span className="text-gray-600">Opponent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                <span className="text-gray-600">Bonus</span>
              </div>
            </div>
            <div className="text-gray-500">
              Round {gameState.round}
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {isMyTurn && !gameEnded && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs text-gray-500 mt-2 text-center"
              >
                Tap a highlighted tile to claim territory
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
