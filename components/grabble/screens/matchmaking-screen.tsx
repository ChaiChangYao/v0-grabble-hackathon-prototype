'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Player } from '@/lib/grabble-types'
import { Search, Target, CheckCircle2, Sparkles } from 'lucide-react'
import { getRandomArena } from '@/grabble/src/data'

interface MatchmakingScreenProps {
  player: Player
  opponent: Player
  matchedSimilarity: number
  onMatched: () => void
}

export function MatchmakingScreen({ player, opponent, matchedSimilarity, onMatched }: MatchmakingScreenProps) {
  const [phase, setPhase] = useState<'searching' | 'found' | 'matched'>('searching')
  const arena = useMemo(() => getRandomArena(), [])
  
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('found'), 2000)
    const timer2 = setTimeout(() => setPhase('matched'), 3500)
    const timer3 = setTimeout(() => onMatched(), 5000)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onMatched])

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-center border-b border-[#e9ecef] px-4 py-4">
        <span className="font-semibold text-[#212529]">Finding Match</span>
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {phase === 'searching' && (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* Animated radar */}
              <div className="relative mb-8 h-40 w-40">
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-full border-4 border-[#00b14f]"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  className="absolute inset-0 rounded-full border-4 border-[#00b14f]"
                />
                <div className="absolute inset-4 flex items-center justify-center rounded-full bg-[#00b14f]/10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="h-20 w-20 rounded-full border-4 border-transparent border-t-[#00b14f]"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Search className="w-8 h-8 text-[#00b14f]" />
                  </motion.div>
                </div>
              </div>
              
              <h2 className="mb-2 text-xl font-bold text-[#212529]">Finding rider with similar fare</h2>
              <p className="text-center text-sm text-[#6c757d]">
                AI is searching for a rider with a fare value within 1% of yours
              </p>
              <p className="mx-auto mt-3 max-w-xs text-center text-xs text-[#adb5bd]">{arena.description}</p>
              
              {/* Your fare */}
              <div className="mt-6 rounded-xl bg-[#f8f9fa] px-6 py-3">
                <p className="text-sm text-[#6c757d]">Your fare value</p>
                <p className="text-2xl font-bold text-[#00b14f]">${player.normalFare.toFixed(2)}</p>
              </div>
            </motion.div>
          )}
          
          {phase === 'found' && (
            <motion.div
              key="found"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#00b14f]"
              >
                <Target className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="mb-2 text-xl font-bold text-[#212529]">Match Found!</h2>
              <p className="mb-6 text-center text-sm text-[#6c757d]">
                A rider with a similar fare value wants to compete
              </p>
              
              {/* Match card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full rounded-2xl bg-gradient-to-br from-[#00b14f]/10 to-[#00923f]/10 p-4"
              >
                <div className="flex items-center justify-between">
                  {/* Your profile */}
                  <div className="flex flex-col items-center">
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#00b14f] text-xl font-bold text-white">
                      {player.name.charAt(0)}
                    </div>
                    <p className="text-sm font-medium text-[#212529]">{player.name}</p>
                    <p className="text-xs text-[#6c757d]">${player.normalFare.toFixed(2)}</p>
                  </div>
                  
                  {/* VS */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff6b00] text-lg font-bold text-white"
                  >
                    VS
                  </motion.div>
                  
                  {/* Opponent profile */}
                  <div className="flex flex-col items-center">
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff6b00] text-xl font-bold text-white">
                      {opponent.name.charAt(0)}
                    </div>
                    <p className="text-sm font-medium text-[#212529]">{opponent.name}</p>
                    <p className="text-xs text-[#6c757d]">${opponent.normalFare.toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {phase === 'matched' && (
            <motion.div
              key="matched"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#00b14f] to-[#00923f]"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="mb-2 text-xl font-bold text-[#212529]">Both Riders Accepted!</h2>
              
              {/* Similarity badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-4 flex items-center gap-2 rounded-full bg-[#e6f7ed] px-4 py-2"
              >
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Sparkles className="w-4 h-4 text-[#00b14f]" />
                </motion.div>
                <span className="text-sm font-medium text-[#00923f]">
                  {matchedSimilarity}% fare similarity
                </span>
              </motion.div>
              
              <p className="mb-6 text-center text-sm text-[#6c757d]">
                AI matched you because your fare values are within 1% difference
              </p>
              
              {/* Trip summary */}
              <div className="w-full space-y-3">
                <div className="rounded-xl bg-[#f8f9fa] p-3">
                  <p className="text-xs text-[#6c757d]">{player.name}</p>
                  <p className="text-sm font-medium text-[#212529]">{player.pickup} → {player.destination}</p>
                </div>
                <div className="rounded-xl bg-[#f8f9fa] p-3">
                  <p className="text-xs text-[#6c757d]">{opponent.name}</p>
                  <p className="text-sm font-medium text-[#212529]">{opponent.pickup} → {opponent.destination}</p>
                </div>
              </div>
              
              {/* Loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex items-center gap-2 text-sm text-[#6c757d]"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="h-4 w-4 rounded-full border-2 border-[#00b14f] border-t-transparent"
                />
                Selecting game...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
