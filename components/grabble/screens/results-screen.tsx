'use client'

import { motion } from 'framer-motion'
import { Player, GameType } from '@/lib/grabble-types'

interface ResultsScreenProps {
  playerId: 1 | 2
  player: Player
  opponent: Player
  winner: 1 | 2
  gameType: GameType
  onContinue: () => void
}

export function ResultsScreen({ playerId, player, opponent, winner, gameType, onContinue }: ResultsScreenProps) {
  const isWinner = playerId === winner
  const finalFare = isWinner ? player.winnerFare : player.loserFare
  const multiplier = isWinner ? '0.5x' : '1.5x'
  const savings = isWinner 
    ? player.normalFare - player.winnerFare 
    : player.loserFare - player.normalFare
  
  const aiSummary = isWinner
    ? gameType === 'faremon-duel'
      ? `${player.name} won by timing strategic moves perfectly. The opponent's shield expired at the worst moment, allowing a decisive final strike.`
      : `${player.name} won by building efficient route networks and maintaining lower surge pressure throughout the game.`
    : gameType === 'faremon-duel'
      ? `${opponent.name} won by using a balanced strategy of defense and offense. Your high-risk moves backfired at critical moments.`
      : `${opponent.name} won by clearing more rows and columns while keeping surge pressure under control.`

  return (
    <div className={`flex h-full flex-col ${isWinner ? 'bg-gradient-to-b from-[#00b14f] to-[#00923f]' : 'bg-gradient-to-b from-[#ff6b00] to-[#e65c00]'}`}>
      {/* Confetti for winner */}
      {isWinner && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: -20, 
                x: Math.random() * 375,
                rotate: 0,
                opacity: 1
              }}
              animate={{ 
                y: 800,
                rotate: Math.random() * 720 - 360,
                opacity: 0
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                ease: 'linear'
              }}
              className={`absolute h-3 w-3 rounded-sm ${
                i % 3 === 0 ? 'bg-yellow-400' : i % 3 === 1 ? 'bg-white' : 'bg-yellow-200'
              }`}
            />
          ))}
        </div>
      )}
      
      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Result icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-2xl"
        >
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-6xl"
          >
            {isWinner ? '🏆' : '😔'}
          </motion.span>
        </motion.div>
        
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-2 text-center text-2xl font-bold text-white"
        >
          {isWinner ? 'You Won!' : 'You Lost'}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 text-center text-white/90"
        >
          {isWinner ? `${multiplier} fare unlocked` : `${multiplier} fare applied`}
        </motion.p>
        
        {/* Fare breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 w-full space-y-3"
        >
          {/* Final fare - hero card */}
          <div className="rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-sm text-[#6c757d]">Your final fare</p>
            <div className="flex items-baseline gap-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className={`text-4xl font-bold ${isWinner ? 'text-[#00b14f]' : 'text-[#ff6b00]'}`}
              >
                ${finalFare.toFixed(2)}
              </motion.span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                isWinner ? 'bg-[#e6f7ed] text-[#00b14f]' : 'bg-[#fff0e6] text-[#ff6b00]'
              }`}>
                {multiplier}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {isWinner ? (
                <>
                  <span className="text-sm text-[#00b14f]">↓</span>
                  <span className="text-sm text-[#00b14f]">You saved ${savings.toFixed(2)}</span>
                </>
              ) : (
                <>
                  <span className="text-sm text-[#ff6b00]">↑</span>
                  <span className="text-sm text-[#ff6b00]">${savings.toFixed(2)} extra</span>
                </>
              )}
            </div>
          </div>
          
          {/* Normal fare reference */}
          <div className="flex items-center justify-between rounded-xl bg-white/20 px-4 py-3">
            <span className="text-sm text-white/80">Normal fare</span>
            <span className="text-sm font-medium text-white line-through opacity-70">${player.normalFare.toFixed(2)}</span>
          </div>
        </motion.div>
        
        {/* AI Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full rounded-2xl bg-white/10 p-4 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ✨
              </motion.span>
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">AI Summary</p>
              <p className="text-sm text-white/90">{aiSummary}</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom button */}
      <div className="p-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="w-full rounded-xl bg-white py-4 font-bold text-[#212529] shadow-lg transition-all hover:bg-[#f8f9fa]"
        >
          {isWinner ? 'Apply Winning Fare' : 'Continue to Booking'}
        </motion.button>
      </div>
    </div>
  )
}
