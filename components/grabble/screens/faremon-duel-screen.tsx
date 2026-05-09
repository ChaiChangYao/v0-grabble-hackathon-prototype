'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FareMonState, FareMonMove } from '@/lib/grabble-types'
import { getFareMon, type Move as GameDataMove } from '@/grabble/src/data'
import { getCreatureImageUrlForDisplayName, getArenaImageUrl } from '@/lib/creature-images'
import { getRandomArena } from '@/grabble/src/data'

interface FareMonDuelScreenProps {
  playerId: 1 | 2
  state: FareMonState
  onSelectMove: (move: FareMonMove) => void
  waitingForOpponent: boolean
}

function gameDataMoveToFareMonMove(m: GameDataMove): FareMonMove {
  const type: FareMonMove['type'] =
    m.effect === 'shield'
      ? 'Defense'
      : m.effect === 'debuff'
        ? 'Strategy'
        : m.effect === 'risky'
          ? 'Power'
          : 'Attack'
  const risk: FareMonMove['risk'] =
    m.effect === 'risky' || m.damage >= 28 ? 'High' : m.damage === 0 && m.effect === 'shield' ? 'Low' : 'Medium'
  const effect =
    m.damage > 0 ? `Deals ${m.damage} damage` : m.effect === 'shield' ? 'Adds shield' : 'Rider pressure'
  return {
    name: m.name,
    type,
    effect,
    risk,
    description: effect,
  }
}

function CreatureCard({ 
  creature, 
  isOpponent,
  isAttacking 
}: { 
  creature: { name: string; type: string; visualDescription: string; hp: number; maxHp: number; shield: number; farePressure: number }
  isOpponent: boolean
  isAttacking?: boolean
}) {
  const hpPercent = (creature.hp / creature.maxHp) * 100
  const hpColor = hpPercent > 50 ? '#00b14f' : hpPercent > 25 ? '#ff6b00' : '#dc3545'
  const creatureImageUrl = getCreatureImageUrlForDisplayName(creature.name)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [creature.name])
  
  return (
    <motion.div
      animate={isAttacking ? { x: isOpponent ? [-10, 10, 0] : [10, -10, 0], scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`relative ${isOpponent ? 'items-end' : 'items-start'}`}
    >
      {/* Creature visual */}
      <div className={`relative ${isOpponent ? 'flex justify-end' : ''}`}>
        <motion.div
          animate={{ 
            y: [0, -5, 0],
            filter: creature.shield > 0 ? ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] : 'brightness(1)'
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`relative flex h-20 w-20 items-center justify-center rounded-2xl ${
            isOpponent 
              ? 'bg-gradient-to-br from-[#ff6b00]/20 to-[#ff6b00]/10' 
              : 'bg-gradient-to-br from-[#00b14f]/20 to-[#00b14f]/10'
          }`}
        >
          {/* Creature art: `public/grabble/creatures/<imageFile>` (Next.js) vs Vite `new URL(..., import.meta.url)` */}
          {creatureImageUrl && !imageFailed ? (
            <img
              src={creatureImageUrl}
              alt={creature.name}
              className="h-12 w-12 rounded-xl object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
          <div className={`w-12 h-12 rounded-xl ${isOpponent ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'} flex items-center justify-center`}>
            <span className="text-white font-bold text-lg">{creature.name.charAt(0)}</span>
          </div>
          )}
          
          {/* Shield indicator */}
          {creature.shield > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500"
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.617 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.35a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {/* Stats */}
      <div className={`mt-2 ${isOpponent ? 'text-right' : ''}`}>
        <p className="text-sm font-bold text-[#212529]">{creature.name}</p>
        <p className="text-xs text-[#6c757d]">{creature.type}</p>
        
        {/* HP bar */}
        <div className="mt-1.5 flex items-center gap-2">
          {isOpponent && <span className="text-xs font-medium text-[#212529]">{creature.hp}/{creature.maxHp}</span>}
          <div className={`h-2.5 flex-1 overflow-hidden rounded-full bg-[#e9ecef] ${isOpponent ? 'max-w-[120px]' : 'max-w-[120px]'}`}>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-full rounded-full"
              style={{ backgroundColor: hpColor }}
            />
          </div>
          {!isOpponent && <span className="text-xs font-medium text-[#212529]">{creature.hp}/{creature.maxHp}</span>}
        </div>
        
        {/* Fare pressure */}
        <div className="mt-1 flex items-center gap-1">
          <span className="text-[10px] text-[#6c757d]">Fare Pressure:</span>
          <span className={`text-[10px] font-medium ${creature.farePressure > 70 ? 'text-[#dc3545]' : creature.farePressure > 50 ? 'text-[#ff6b00]' : 'text-[#00b14f]'}`}>
            {creature.farePressure}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function MoveButton({ 
  move, 
  onClick, 
  disabled 
}: { 
  move: FareMonMove
  onClick: () => void
  disabled: boolean 
}) {
  const typeColors = {
    Attack: { bg: 'from-red-500/20 to-red-500/10', border: 'border-red-500/30', text: 'text-red-600' },
    Defense: { bg: 'from-blue-500/20 to-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600' },
    Strategy: { bg: 'from-amber-500/20 to-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600' },
    Power: { bg: 'from-purple-500/20 to-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-600' },
  }
  
  const colors = typeColors[move.type]
  
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colors.bg} ${colors.border} p-3 text-left transition-all ${
        disabled ? 'opacity-50' : 'hover:shadow-md active:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#212529]">{move.name}</p>
          <p className={`text-[10px] font-medium ${colors.text}`}>{move.type}</p>
        </div>
        <div className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
          move.risk === 'Low' ? 'bg-green-100 text-green-700' :
          move.risk === 'Medium' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {move.risk}
        </div>
      </div>
      <p className="mt-1 text-[10px] text-[#6c757d]">{move.effect}</p>
    </motion.button>
  )
}

export function FareMonDuelScreen({ playerId, state, onSelectMove, waitingForOpponent }: FareMonDuelScreenProps) {
  const [imagePrompt, setImagePrompt] = useState<string>('')
  const arena = useMemo(() => getRandomArena(), [])
  const arenaBgUrl = getArenaImageUrl(arena.imageFile)
  const [arenaBgFailed, setArenaBgFailed] = useState(false)
  const duelCreature = useMemo(
    () => getFareMon(playerId === 1 ? 'surge-serpent' : 'terminal-tiger'),
    [playerId]
  )
  const moves = useMemo(
    () => duelCreature.moves.map(gameDataMoveToFareMonMove),
    [duelCreature]
  )
  
  const playerCreature = playerId === 1 ? state.player1Creature : state.player2Creature
  const opponentCreature = playerId === 1 ? state.player2Creature : state.player1Creature
  const hasSelectedMove = playerId === 1 ? state.player1Move !== null : state.player2Move !== null
  
  useEffect(() => {
    setImagePrompt(duelCreature.promptTemplate)
  }, [duelCreature])
  
  return (
    <div className="relative flex h-full min-h-0 flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Next: `public/grabble/arenas/<imageFile>` — Vite used `new URL(../assets/arenas/..., import.meta.url)` */}
      {!arenaBgFailed && (
        <img src={arenaBgUrl} alt="" className="hidden" onError={() => setArenaBgFailed(true)} aria-hidden />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.35]"
        style={
          arenaBgFailed
            ? undefined
            : { backgroundImage: `url(${arenaBgUrl})` }
        }
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/85 to-[#16213e]/90" aria-hidden />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-semibold text-white">FareMon Duel</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
          <span className="text-xs text-white/70">Turn</span>
          <span className="text-sm font-bold text-white">{state.currentTurn}/{state.maxTurns}</span>
        </div>
      </div>
      
      {/* AI Image Generation Prompt */}
      <div className="px-3 py-2 bg-black/30 border-b border-white/10">
        <p className="text-[9px] text-gray-400 font-mono leading-tight">
          <span className="text-[#00b14f]">AI Image Prompt:</span> {imagePrompt}
        </p>
      </div>
      
      {/* Battle arena */}
      <div className="relative flex-1 p-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-[#00b14f]/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-[#ff6b00]/10 blur-3xl" />
        </div>
        
        {/* Opponent (top) */}
        <div className="flex justify-end mb-4">
          <CreatureCard creature={opponentCreature} isOpponent />
        </div>
        
        {/* Battle log (last 2 entries) */}
        <div className="mb-4 space-y-1 min-h-[40px]">
          {state.battleLog.slice(-2).map((log, i) => (
            <motion.p
              key={`${log}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center text-[10px] text-white/60"
            >
              {log}
            </motion.p>
          ))}
        </div>
        
        {/* Player (bottom) */}
        <div className="flex justify-start mb-4">
          <CreatureCard creature={playerCreature} isOpponent={false} />
        </div>
      </div>
      
      {/* Move selection */}
      <div className="bg-white rounded-t-3xl p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        {waitingForOpponent || hasSelectedMove ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="mb-3 h-10 w-10 rounded-full border-3 border-[#00b14f] border-t-transparent"
            />
            <p className="font-medium text-[#212529]">Waiting for opponent</p>
            <p className="text-sm text-[#6c757d]">Your move has been locked in</p>
          </motion.div>
        ) : (
          <>
            <p className="mb-3 text-center text-sm font-medium text-[#6c757d]">Choose your move</p>
            <div className="grid grid-cols-2 gap-2">
              {moves.map((move) => (
                <MoveButton
                  key={move.name}
                  move={move}
                  onClick={() => onSelectMove(move)}
                  disabled={hasSelectedMove}
                />
              ))}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
