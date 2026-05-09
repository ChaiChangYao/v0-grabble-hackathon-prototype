'use client'

import { motion } from 'framer-motion'
import { GameType, Player } from '@/lib/grabble-types'
import { Sparkles, Swords, Map, DollarSign } from 'lucide-react'

interface PreGameScreenProps {
  player: Player
  selectedGame: GameType
  onEnterChallenge: () => void
}

const gameDetails: Record<GameType, { title: string; description: string; icon: React.ReactNode }> = {
  'faremon-duel': {
    title: 'FareMon Duel',
    description: 'Type-based ride creature battle. Choose your hidden FareMon types before the duel begins.',
    icon: <Swords className="w-8 h-8 text-white" />,
  },
  'battleroute': {
    title: 'BattleRoute',
    description: 'Hidden-route guessing strategy. Place your route assets, then strike your opponent\'s grid.',
    icon: <Map className="w-8 h-8 text-white" />,
  },
}

export function PreGameScreen({ player, selectedGame, onEnterChallenge }: PreGameScreenProps) {
  const game = gameDetails[selectedGame]
  
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 border-b border-white/10 px-4 py-4">
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Sparkles className="w-5 h-5 text-[#00b14f]" />
        </motion.div>
        <span className="font-semibold text-white">AI Selected Game</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Game icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00b14f] to-[#00923f] shadow-lg shadow-[#00b14f]/30"
        >
          {game.icon}
        </motion.div>
        
        {/* Game title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-2 text-center text-2xl font-bold text-white"
        >
          AI selected {game.title}
        </motion.h1>
        
        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 max-w-[280px] text-center text-sm text-white/70 leading-relaxed"
        >
          {game.description}
        </motion.p>
        
        {/* Fare stake summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 w-full max-w-[280px] rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-[#00b14f]" />
            <span className="text-sm font-medium text-white">Fare Stake</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Normal Fare</span>
              <span className="text-sm font-medium text-white">S${player.normalFare.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#00b14f]">Winner Pays (0.5x)</span>
              <span className="text-sm font-bold text-[#00b14f]">S${player.winnerFare.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#ff6b00]">Loser Pays (1.5x)</span>
              <span className="text-sm font-medium text-[#ff6b00]">S${player.loserFare.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* CTA */}
      <div className="p-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnterChallenge}
          className="w-full rounded-xl bg-[#00b14f] py-4 font-semibold text-white shadow-lg shadow-[#00b14f]/30 transition-all hover:bg-[#00923f]"
        >
          Enter Challenge
        </motion.button>
      </div>
    </div>
  )
}
