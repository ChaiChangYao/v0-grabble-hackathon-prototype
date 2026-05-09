"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  BattleRouteState,
  routeAssets,
  placeRouteAsset,
  submitRouteAttack,
  getBattleRoutePlayerPerspective,
  RouteAsset,
} from "@/lib/battleroute-engine"
import { Car, Bike, MapPin, Bus, Package, RotateCw, Target } from "lucide-react"

interface BattleRouteScreenProps {
  playerId: 1 | 2
  state: BattleRouteState
  onSelectPath: (pathIndex: number) => void
}

const assetIcons: Record<string, typeof Car> = {
  van: Bus,
  shuttle: Car,
  taxi: Car,
  bike: Bike,
  hub: MapPin,
}

export function BattleRouteScreen({ playerId, state, onSelectPath }: BattleRouteScreenProps) {
  const [selectedAsset, setSelectedAsset] = useState<RouteAsset | null>(null)
  const [isHorizontal, setIsHorizontal] = useState(true)
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null)
  
  const perspective = getBattleRoutePlayerPerspective(state, playerId)
  const isMyTurn = state.currentTurn === playerId
  const isPlacementPhase = state.phase === 'placement'
  const isAttackPhase = state.phase === 'attack'
  
  // Auto-select first unplaced asset
  useEffect(() => {
    if (isPlacementPhase && perspective.assetsToPlace.length > 0 && !selectedAsset) {
      setSelectedAsset(perspective.assetsToPlace[0])
    }
  }, [isPlacementPhase, perspective.assetsToPlace, selectedAsset])
  
  const handleCellClick = (row: number, col: number) => {
    if (isPlacementPhase && selectedAsset) {
      // Placement mode - send coordinates as encoded path index
      const encodedIndex = row * 100 + col * 10 + (isHorizontal ? 1 : 0)
      onSelectPath(encodedIndex)
      setSelectedAsset(null)
    } else if (isAttackPhase && isMyTurn) {
      // Attack mode
      if (perspective.opponentGrid[row][col] === 'unknown') {
        const encodedIndex = 1000 + row * 10 + col
        onSelectPath(encodedIndex)
      }
    }
  }
  
  const toggleRotation = () => setIsHorizontal(!isHorizontal)
  
  // Render own grid (for placement) or opponent grid (for attack)
  const renderGrid = (gridType: 'own' | 'opponent') => {
    const grid = gridType === 'own' ? perspective.ownGrid : perspective.opponentGrid
    const gridSize = 6
    
    return (
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {Array(gridSize).fill(null).map((_, rowIdx) =>
          Array(gridSize).fill(null).map((_, colIdx) => {
            const cell = grid[rowIdx][colIdx]
            const isHover = hoverCell?.row === rowIdx && hoverCell?.col === colIdx
            
            let bgColor = 'bg-gray-100'
            let borderColor = 'border-gray-200'
            let content = null
            
            if (gridType === 'own') {
              if (cell === 'asset') {
                bgColor = playerId === 1 ? 'bg-[#00b14f]' : 'bg-[#ff6b00]'
                borderColor = playerId === 1 ? 'border-[#00923f]' : 'border-[#e55a00]'
              } else if (cell === 'hit') {
                bgColor = 'bg-red-500'
                borderColor = 'border-red-600'
                content = <Target className="w-3 h-3 text-white" />
              } else if (cell === 'miss') {
                bgColor = 'bg-gray-300'
                borderColor = 'border-gray-400'
              }
            } else {
              if (cell === 'hit') {
                bgColor = 'bg-[#00b14f]'
                borderColor = 'border-[#00923f]'
                content = <Target className="w-3 h-3 text-white" />
              } else if (cell === 'miss') {
                bgColor = 'bg-gray-300'
                borderColor = 'border-gray-400'
              }
            }
            
            const canClick = gridType === 'opponent' && cell === 'unknown' && isMyTurn && isAttackPhase
            
            return (
              <motion.button
                key={`${rowIdx}-${colIdx}`}
                className={cn(
                  "w-7 h-7 rounded border-2 flex items-center justify-center transition-all",
                  bgColor,
                  borderColor,
                  canClick && "ring-2 ring-[#00b14f]/50 cursor-pointer hover:ring-[#00b14f]",
                  !canClick && gridType === 'opponent' && "cursor-default"
                )}
                onClick={() => handleCellClick(rowIdx, colIdx)}
                onMouseEnter={() => setHoverCell({ row: rowIdx, col: colIdx })}
                onMouseLeave={() => setHoverCell(null)}
                whileTap={canClick ? { scale: 0.9 } : {}}
              >
                {content}
              </motion.button>
            )
          })
        )}
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">BattleRoute</div>
          <div className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            isMyTurn ? "bg-[#00b14f] text-white" : "bg-white/20 text-white/70"
          )}>
            {isPlacementPhase 
              ? (perspective.assetsToPlace.length > 0 ? 'Place Assets' : 'Waiting')
              : (isMyTurn ? 'Your Attack' : 'Opponent')
            }
          </div>
        </div>
      </div>
      
      {/* Game Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {isPlacementPhase ? (
            <motion.div
              key="placement"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Asset selection */}
              {perspective.assetsToPlace.length > 0 && (
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/70">Select asset to place</p>
                    <button
                      onClick={toggleRotation}
                      className="flex items-center gap-1 text-xs text-[#00b14f] hover:text-[#00b14f]/80"
                    >
                      <RotateCw className="w-3 h-3" />
                      {isHorizontal ? 'Horizontal' : 'Vertical'}
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {perspective.assetsToPlace.map(asset => {
                      const Icon = assetIcons[asset.icon] || Car
                      return (
                        <button
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset)}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all",
                            selectedAsset?.id === asset.id
                              ? "bg-[#00b14f] text-white"
                              : "bg-white/10 text-white/70 hover:bg-white/20"
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{asset.name}</span>
                          <span className="text-[10px] opacity-70">({asset.length})</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Own grid for placement */}
              <div className="bg-white rounded-xl p-3 shadow-lg">
                <p className="text-xs text-gray-500 mb-2 text-center">Your Routes</p>
                {renderGrid('own')}
              </div>
              
              {perspective.assetsToPlace.length === 0 && (
                <div className="text-center text-white/70 text-sm py-4">
                  Waiting for opponent to finish placement...
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="attack"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Opponent grid for attack */}
              <div className="bg-white rounded-xl p-3 shadow-lg">
                <p className="text-xs text-gray-500 mb-2 text-center">
                  {isMyTurn ? 'Tap to attack' : 'Opponent attacking...'}
                </p>
                {renderGrid('opponent')}
              </div>
              
              {/* Own grid (smaller) */}
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-white/50 mb-2 text-center">Your Routes</p>
                <div className="transform scale-75 origin-center">
                  {renderGrid('own')}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-[#00b14f]" />
                <span>Hit</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-gray-400" />
                <span>Miss</span>
              </div>
            </div>
            <span>Attacks: {state.attackLog.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
