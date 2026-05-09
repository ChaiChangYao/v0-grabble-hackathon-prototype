'use client'

import { motion } from 'framer-motion'
import { Player } from '@/lib/grabble-types'
import { X, Trophy, Wallet, Info, Users, Sparkles, Swords } from 'lucide-react'

interface GrabbleOptInScreenProps {
  player: Player
  onAccept: () => void
  onDecline: () => void
}

export function GrabbleOptInScreen({ player, onAccept, onDecline }: GrabbleOptInScreenProps) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#00b14f] to-[#00923f]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onDecline}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
        >
          <X className="h-5 w-5 text-white" />
        </motion.button>
        <span className="font-semibold text-white">Grabble Challenge</span>
        <div className="w-10" />
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Swords className="w-12 h-12 text-[#00b14f]" />
          </motion.div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-2 text-center text-2xl font-bold text-white"
        >
          Enter Grabble Challenge
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-center text-white/90"
        >
          Compete against another rider with a similar fare value
        </motion.p>
        
        {/* Fare cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 w-full space-y-3"
        >
          {/* Win scenario */}
          <div className="flex items-center justify-between rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400/30">
                <Trophy className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">If you WIN</p>
                <p className="text-lg font-bold text-white">Pay 0.5x fare</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">${player.winnerFare.toFixed(2)}</p>
              <p className="text-xs text-white/60">Save ${(player.normalFare - player.winnerFare).toFixed(2)}</p>
            </div>
          </div>
          
          {/* Lose scenario */}
          <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff6b00]/30">
                <Wallet className="w-5 h-5 text-[#ff6b00]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">If you LOSE</p>
                <p className="text-lg font-bold text-white">Pay 1.5x fare</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#ff6b00]">${player.loserFare.toFixed(2)}</p>
              <p className="text-xs text-white/60">+${(player.loserFare - player.normalFare).toFixed(2)} extra</p>
            </div>
          </div>
          
          {/* Normal fare reference */}
          <div className="text-center">
            <p className="text-sm text-white/70">
              Normal fare: <span className="font-semibold text-white">${player.normalFare.toFixed(2)}</span>
            </p>
          </div>
        </motion.div>
        
        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6 space-y-2 text-center text-sm text-white/80"
        >
          <p className="flex items-center justify-center gap-2">
            <Info className="h-4 w-4" />
            Strategy-based games, not reflex-based
          </p>
          <p className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            Both riders must accept the challenge
          </p>
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.span>
            AI selects a fair game for both riders
          </span>
        </motion.div>
      </div>
      
      {/* Buttons */}
      <div className="p-4 space-y-3">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAccept}
          className="w-full rounded-xl bg-white py-4 font-bold text-[#00b14f] shadow-lg transition-all hover:bg-[#f8f9fa]"
        >
          Accept Challenge
        </motion.button>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDecline}
          className="w-full rounded-xl bg-white/10 py-4 font-medium text-white transition-all hover:bg-white/20"
        >
          Go back to normal ride
        </motion.button>
      </div>
    </div>
  )
}
