'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameType } from '@/lib/grabble-types'

interface AIGameSelectionScreenProps {
  onGameSelected: (game: GameType) => void
}

const loadingSteps = [
  { text: 'AI is analyzing both trips…', icon: '🔍' },
  { text: 'Checking reaction independence…', icon: '⚡' },
  { text: 'Prioritizing strategy over reflexes…', icon: '🧠' },
  { text: 'Balancing both players with identical rules…', icon: '⚖️' },
  { text: 'Selecting fair game…', icon: '🎮' },
]

export function AIGameSelectionScreen({ onGameSelected }: AIGameSelectionScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    // Randomly select game
    const game: GameType = Math.random() > 0.5 ? 'faremon-duel' : 'fare-blocks'
    
    // Progress through steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) return prev + 1
        return prev
      })
    }, 800)
    
    // Show result after all steps
    const resultTimer = setTimeout(() => {
      setSelectedGame(game)
      setShowResult(true)
    }, loadingSteps.length * 800)
    
    // Transition to game
    const gameTimer = setTimeout(() => {
      onGameSelected(game)
    }, loadingSteps.length * 800 + 2500)
    
    return () => {
      clearInterval(stepInterval)
      clearTimeout(resultTimer)
      clearTimeout(gameTimer)
    }
  }, [onGameSelected])

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-4">
        <span className="font-semibold text-white">AI Game Selection</span>
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* AI brain animation */}
              <div className="relative mb-8">
                <motion.div
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(0, 177, 79, 0.3)',
                      '0 0 60px rgba(0, 177, 79, 0.6)',
                      '0 0 20px rgba(0, 177, 79, 0.3)',
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#00b14f] to-[#00923f]"
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-5xl"
                  >
                    🤖
                  </motion.span>
                </motion.div>
                
                {/* Orbiting particles */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, delay: i * 0.3, ease: 'linear' }}
                    className="absolute inset-0"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                      className="absolute -top-2 left-1/2 h-3 w-3 rounded-full bg-[#00b14f]"
                      style={{ marginLeft: '-6px' }}
                    />
                  </motion.div>
                ))}
              </div>
              
              <h2 className="mb-6 text-xl font-bold text-white">AI is selecting a fair game…</h2>
              
              {/* Steps */}
              <div className="w-full space-y-3">
                {loadingSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: index <= currentStep ? 1 : 0.3,
                      x: 0
                    }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                      index <= currentStep ? 'bg-[#00b14f]/20' : 'bg-white/5'
                    }`}
                  >
                    <span className="text-xl">{step.icon}</span>
                    <span className={`text-sm ${index <= currentStep ? 'text-white' : 'text-white/40'}`}>
                      {step.text}
                    </span>
                    {index < currentStep && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <svg className="h-5 w-5 text-[#00b14f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                    {index === currentStep && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="ml-auto h-5 w-5 rounded-full border-2 border-[#00b14f] border-t-transparent"
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              {/* Game reveal */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="relative mb-6"
              >
                <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00b14f] to-[#00923f] shadow-2xl shadow-[#00b14f]/30">
                  <span className="text-6xl">
                    {selectedGame === 'faremon-duel' ? '⚔️' : '🧩'}
                  </span>
                </div>
                {/* Sparkles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      x: [0, (i % 2 ? 1 : -1) * (30 + Math.random() * 20)],
                      y: [0, (i < 3 ? -1 : 1) * (30 + Math.random() * 20)],
                    }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                    className="absolute left-1/2 top-1/2 text-2xl"
                  >
                    ✨
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-2xl font-bold text-white"
              >
                {selectedGame === 'faremon-duel' ? 'FareMon Duel' : 'Fare Blocks'}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-center text-white/70"
              >
                {selectedGame === 'faremon-duel'
                  ? 'A strategic turn-based creature battle'
                  : 'A strategic route-building puzzle game'}
              </motion.p>
              
              {/* AI explanation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full rounded-2xl bg-white/10 p-4 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00b14f]/30">
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      ✨
                    </motion.span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#00b14f]">AI Selection Reason</p>
                    <p className="text-sm text-white/80">
                      This game was selected for fairness: strategy-based, no reaction advantage, 
                      identical rules for both players.
                    </p>
                  </div>
                </div>
              </motion.div>
              
              {/* Loading into game */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 flex items-center gap-2 text-sm text-white/60"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="h-4 w-4 rounded-full border-2 border-[#00b14f] border-t-transparent"
                />
                Loading game…
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
