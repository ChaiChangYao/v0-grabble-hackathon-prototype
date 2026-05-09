'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FareBlocksState, BlockPiece } from '@/lib/grabble-types'
import { canPlacePiece, getNextPieces } from '@/lib/game-engine'

interface FareBlocksScreenProps {
  playerId: 1 | 2
  state: FareBlocksState
  onPlacePiece: (piece: BlockPiece, row: number, col: number) => void
}

function BlockPieceDisplay({ piece, isSelected, onSelect }: { piece: BlockPiece; isSelected: boolean; onSelect: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={`relative rounded-xl p-2 transition-all ${
        isSelected 
          ? 'bg-[#00b14f]/20 ring-2 ring-[#00b14f] shadow-lg' 
          : 'bg-[#f8f9fa] hover:bg-[#f1f3f5]'
      }`}
    >
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${piece.shape[0]?.length || 1}, 1fr)` }}>
        {piece.shape.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`h-4 w-4 rounded-sm transition-colors ${
                cell 
                  ? isSelected ? 'bg-[#00b14f]' : 'bg-[#00b14f]/60'
                  : 'bg-transparent'
              }`}
            />
          ))
        )}
      </div>
    </motion.button>
  )
}

export function FareBlocksScreen({ playerId, state, onPlacePiece }: FareBlocksScreenProps) {
  const [selectedPiece, setSelectedPiece] = useState<BlockPiece | null>(null)
  const [invalidCell, setInvalidCell] = useState<{ row: number; col: number } | null>(null)
  
  const playerState = playerId === 1 ? state.player1 : state.player2
  const opponentState = playerId === 1 ? state.player2 : state.player1
  const availablePieces = getNextPieces(state)
  
  const handleCellClick = (row: number, col: number) => {
    if (!selectedPiece) return
    
    if (canPlacePiece(playerState.grid, selectedPiece, row, col)) {
      onPlacePiece(selectedPiece, row, col)
      setSelectedPiece(null)
    } else {
      setInvalidCell({ row, col })
      setTimeout(() => setInvalidCell(null), 500)
    }
  }

  const surgePressureColor = playerState.surgePressure > 70 
    ? '#dc3545' 
    : playerState.surgePressure > 50 
      ? '#ff6b00' 
      : '#00b14f'

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧩</span>
          <span className="font-semibold text-white">Fare Blocks</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
          <span className="text-xs text-white/70">Moves</span>
          <span className="text-sm font-bold text-white">{playerState.movesRemaining}</span>
        </div>
      </div>
      
      {/* Opponent comparison strip */}
      <div className="flex items-center justify-between bg-white/5 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6b00]/20 text-xs">
            👤
          </div>
          <span className="text-xs text-white/70">Opponent</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-white/50">Score</p>
            <p className="text-sm font-bold text-white">{opponentState.score}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/50">Surge</p>
            <p className="text-sm font-bold text-[#ff6b00]">{opponentState.surgePressure}%</p>
          </div>
        </div>
      </div>
      
      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Modifier badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 rounded-full bg-[#ff6b00]/20 px-3 py-1"
        >
          <span className="text-xs">⚡</span>
          <span className="text-xs font-medium text-[#ff6b00]">{state.modifier.name}</span>
        </motion.div>
        
        {/* Grid */}
        <motion.div
          animate={invalidCell ? { x: [-5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl bg-gradient-to-br from-[#1e3a5f]/50 to-[#0f2744]/50 p-3 shadow-2xl backdrop-blur-sm"
        >
          {/* Grid glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-[#00b14f]/5 pointer-events-none" />
          
          <div className="grid grid-cols-6 gap-1.5">
            {playerState.grid.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const canPlace = selectedPiece && canPlacePiece(playerState.grid, selectedPiece, rIdx, cIdx)
                const isInvalid = invalidCell?.row === rIdx && invalidCell?.col === cIdx
                
                return (
                  <motion.button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    animate={isInvalid ? { scale: [1, 0.9, 1] } : {}}
                    whileHover={selectedPiece && !cell ? { scale: 1.05 } : {}}
                    className={`h-10 w-10 rounded-lg transition-all ${
                      cell 
                        ? 'bg-gradient-to-br from-[#00b14f] to-[#00923f] shadow-inner shadow-[#00923f]/50' 
                        : canPlace
                          ? 'bg-[#00b14f]/20 ring-1 ring-[#00b14f]/40'
                          : 'bg-[#1e3a5f]/30 hover:bg-[#1e3a5f]/50'
                    } ${isInvalid ? 'bg-red-500/30 ring-2 ring-red-500' : ''}`}
                  >
                    {cell && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-full w-full rounded-lg"
                      />
                    )}
                  </motion.button>
                )
              })
            )}
          </div>
        </motion.div>
        
        {/* AI Hint */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.aiHint}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 max-w-[280px] rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm"
          >
            <div className="flex items-start gap-2">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-sm"
              >
                💡
              </motion.span>
              <p className="text-xs text-white/80">AI Hint: {state.aiHint}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Bottom panel */}
      <div className="rounded-t-3xl bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        {/* Your stats */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6c757d]">Your Score</p>
            <motion.p
              key={playerState.score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-[#00b14f]"
            >
              {playerState.score}
            </motion.p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#6c757d]">Surge Pressure</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-[#e9ecef]">
                <motion.div
                  initial={{ width: '50%' }}
                  animate={{ width: `${playerState.surgePressure}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: surgePressureColor }}
                />
              </div>
              <span 
                className="text-sm font-bold"
                style={{ color: surgePressureColor }}
              >
                {playerState.surgePressure}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Piece selection */}
        <div>
          <p className="mb-2 text-xs font-medium text-[#6c757d]">Select a route block</p>
          <div className="flex justify-center gap-3">
            {availablePieces.map((piece, index) => (
              <BlockPieceDisplay
                key={`${piece.id}-${index}`}
                piece={piece}
                isSelected={selectedPiece?.id === piece.id}
                onSelect={() => setSelectedPiece(selectedPiece?.id === piece.id ? null : piece)}
              />
            ))}
          </div>
        </div>
        
        {selectedPiece && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-center text-xs text-[#6c757d]"
          >
            Tap a cell to place <span className="font-medium text-[#00b14f]">{selectedPiece.name}</span>
          </motion.p>
        )}
      </div>
    </div>
  )
}
