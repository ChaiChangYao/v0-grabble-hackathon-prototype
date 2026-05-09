'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FareMonBattleState, FareMonMove, FareMon } from '@/lib/faremon-engine'
import { ArrowRightLeft, Flame, Leaf, Droplets, Shield, Zap, Target, Sparkles } from 'lucide-react'

interface FareMonBattleScreenProps {
  playerId: 1 | 2
  state: FareMonBattleState
  onSelectMove: (move: FareMonMove) => void
  onSwitch: () => void
  waitingForOpponent: boolean
}

const typeIcons: Record<string, React.ReactNode> = {
  fire: <Flame className="w-4 h-4" />,
  grass: <Leaf className="w-4 h-4" />,
  water: <Droplets className="w-4 h-4" />,
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  fire: { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/50' },
  grass: { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/50' },
  water: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/50' },
}

const categoryIcons: Record<string, React.ReactNode> = {
  attack: <Zap className="w-3 h-3" />,
  defense: <Shield className="w-3 h-3" />,
  strategy: <Target className="w-3 h-3" />,
  power: <Sparkles className="w-3 h-3" />,
}

function CreatureDisplay({ 
  faremon, 
  isOpponent,
  showType = true
}: { 
  faremon: FareMon
  isOpponent: boolean
  showType?: boolean
}) {
  const hpPercent = (faremon.currentHP / faremon.maxHP) * 100
  const hpColor = hpPercent > 50 ? '#00b14f' : hpPercent > 25 ? '#ff6b00' : '#dc3545'
  const typeColor = typeColors[faremon.type]
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isOpponent ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${isOpponent ? 'items-end text-right' : 'items-start text-left'}`}
    >
      {/* Creature visual */}
      <div className={`relative ${isOpponent ? 'flex justify-end' : ''}`}>
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`relative flex h-16 w-16 items-center justify-center rounded-xl ${typeColor.bg} border ${typeColor.border}`}
        >
          <span className={`text-2xl font-bold ${typeColor.text}`}>{faremon.name.charAt(0)}</span>
        </motion.div>
      </div>
      
      {/* Stats */}
      <div className={`mt-2 ${isOpponent ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2">
          {!isOpponent && showType && (
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColor.bg} ${typeColor.text}`}>
              {typeIcons[faremon.type]}
              {faremon.type.toUpperCase()}
            </span>
          )}
          <span className="text-sm font-bold text-white">{faremon.name}</span>
          {isOpponent && showType && (
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColor.bg} ${typeColor.text}`}>
              {typeIcons[faremon.type]}
            </span>
          )}
        </div>
        
        {/* HP bar */}
        <div className="mt-1.5 flex items-center gap-2">
          {isOpponent && <span className="text-[10px] font-medium text-white/80">{faremon.currentHP}/{faremon.maxHP}</span>}
          <div className={`h-2 flex-1 overflow-hidden rounded-full bg-white/10 ${isOpponent ? 'max-w-[100px]' : 'max-w-[100px]'}`}>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-full rounded-full"
              style={{ backgroundColor: hpColor }}
            />
          </div>
          {!isOpponent && <span className="text-[10px] font-medium text-white/80">{faremon.currentHP}/{faremon.maxHP}</span>}
        </div>
        
        {/* Stats row */}
        {!isOpponent && (
          <div className="mt-1 flex gap-3 text-[10px] text-white/60">
            <span>ATK {faremon.attack}</span>
            <span>DEF {faremon.defense}</span>
            <span>SPD {faremon.speed}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function MoveButton({ 
  move, 
  onClick, 
  disabled,
  selected
}: { 
  move: FareMonMove
  onClick: () => void
  disabled: boolean
  selected: boolean
}) {
  const typeColor = move.type === 'neutral' 
    ? { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
    : typeColors[move.type]
  
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-lg border p-2.5 text-left transition-all ${typeColor.bg} ${
        selected ? `${typeColor.border} ring-2 ring-white/30` : 'border-white/10'
      } ${disabled ? 'opacity-50' : 'hover:border-white/30'}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={`${typeColor.text}`}>{categoryIcons[move.category]}</span>
            <span className="text-xs font-bold text-white truncate">{move.name}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/60">
            {move.power > 0 && <span>PWR {move.power}</span>}
            <span>ACC {move.accuracy}%</span>
          </div>
        </div>
        {move.type !== 'neutral' && (
          <span className={`${typeColor.text}`}>{typeIcons[move.type]}</span>
        )}
      </div>
    </motion.button>
  )
}

export function FareMonBattleScreen({ 
  playerId, 
  state, 
  onSelectMove, 
  onSwitch,
  waitingForOpponent 
}: FareMonBattleScreenProps) {
  const [selectedMove, setSelectedMove] = useState<FareMonMove | null>(null)
  
  const playerTeam = playerId === 1 ? state.player1Team : state.player2Team
  const opponentTeam = playerId === 1 ? state.player2Team : state.player1Team
  
  const playerActive = playerTeam.activeFareMonIndex === 0 ? playerTeam.faremon1 : playerTeam.faremon2
  const opponentActive = opponentTeam.activeFareMonIndex === 0 ? opponentTeam.faremon1 : opponentTeam.faremon2
  const playerReserve = playerTeam.activeFareMonIndex === 0 ? playerTeam.faremon2 : playerTeam.faremon1
  
  const hasSelectedMove = playerId === 1 ? state.player1SelectedMove !== null : state.player2SelectedMove !== null
  const canSwitch = playerReserve && playerReserve.currentHP > 0
  
  if (!playerActive || !opponentActive) return null
  
  const handleConfirmMove = () => {
    if (selectedMove) {
      onSelectMove(selectedMove)
      setSelectedMove(null)
    }
  }
  
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00b14f]" />
          <span className="font-semibold text-white text-sm">FareMon Duel</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
          <span className="text-[10px] text-white/70">Turn</span>
          <span className="text-xs font-bold text-white">{state.currentTurn}/{state.maxTurns}</span>
        </div>
      </div>
      
      {/* AI Prompts Display */}
      <div className="px-3 py-1.5 bg-black/30 border-b border-white/10 overflow-x-auto">
        <p className="text-[8px] text-gray-500 font-mono whitespace-nowrap">
          <span className="text-[#00b14f]">bg:</span> {state.backgroundPrompt.slice(0, 80)}...
        </p>
      </div>
      
      {/* Battle arena */}
      <div className="flex-1 p-3 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full bg-[#00b14f]/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-[#ff6b00]/5 blur-3xl" />
        </div>
        
        {/* Opponent (top-right) */}
        <div className="flex justify-end mb-3">
          <CreatureDisplay faremon={opponentActive} isOpponent />
        </div>
        
        {/* Battle log */}
        <div className="mb-3 min-h-[50px] rounded-lg bg-black/30 p-2 border border-white/5">
          <div className="space-y-0.5 max-h-[60px] overflow-y-auto">
            {state.battleLog.slice(-4).map((log, i) => (
              <motion.p
                key={`${log}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] text-white/70"
              >
                {log}
              </motion.p>
            ))}
          </div>
          {state.effectivenessMessage && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-1 text-xs font-bold ${
                state.effectivenessMessage.includes('Super') ? 'text-green-400' :
                state.effectivenessMessage.includes('Not very') ? 'text-red-400' :
                state.effectivenessMessage.includes('Missed') ? 'text-gray-400' :
                'text-white/80'
              }`}
            >
              {state.effectivenessMessage}
            </motion.p>
          )}
        </div>
        
        {/* Player (bottom-left) */}
        <div className="flex justify-start mb-2">
          <CreatureDisplay faremon={playerActive} isOpponent={false} />
        </div>
        
        {/* Reserve indicator */}
        {playerReserve && (
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 border border-white/10">
            <span className="text-[10px] text-white/60">Reserve:</span>
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
              playerReserve.currentHP > 0 ? 'bg-white/10 text-white/80' : 'bg-red-500/20 text-red-400'
            }`}>
              {typeIcons[playerReserve.type]}
              <span>{playerReserve.name}</span>
              <span className="text-white/40">{playerReserve.currentHP}/{playerReserve.maxHP}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Move selection */}
      <div className="bg-[#0f0f1a] rounded-t-2xl p-3 border-t border-white/10">
        {waitingForOpponent || hasSelectedMove ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="mb-2 h-8 w-8 rounded-full border-2 border-[#00b14f] border-t-transparent"
            />
            <p className="font-medium text-white text-sm">Waiting for opponent</p>
            <p className="text-xs text-white/60">Move locked in</p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/60">Choose your move</span>
              {canSwitch && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onSwitch}
                  className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-white/80 hover:bg-white/20"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  Switch
                </motion.button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              {playerActive.moves.map((move) => (
                <MoveButton
                  key={move.id}
                  move={move}
                  onClick={() => setSelectedMove(move)}
                  disabled={hasSelectedMove}
                  selected={selectedMove?.id === move.id}
                />
              ))}
            </div>
            
            <AnimatePresence>
              {selectedMove && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmMove}
                  className="w-full rounded-lg bg-[#00b14f] py-3 font-semibold text-white shadow-lg shadow-[#00b14f]/30"
                >
                  Confirm Move
                </motion.button>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
