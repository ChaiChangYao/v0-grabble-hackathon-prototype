'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FareMonType, FareMonTeam } from '@/lib/faremon-engine'
import { Check, Lock, Flame, Leaf, Droplets } from 'lucide-react'

interface FareMonTypeSelectionScreenProps {
  playerId: 1 | 2
  team: FareMonTeam
  opponentLocked: boolean
  onSelectType: (type: FareMonType) => void
  onLockIn: () => void
}

const typeInfo: Record<FareMonType, { 
  name: string
  color: string
  bgColor: string
  borderColor: string
  strongAgainst: string
  weakAgainst: string
  icon: React.ReactNode
}> = {
  fire: {
    name: 'Fire',
    color: 'text-orange-500',
    bgColor: 'bg-gradient-to-br from-orange-500/20 to-red-500/10',
    borderColor: 'border-orange-500/50',
    strongAgainst: 'Grass',
    weakAgainst: 'Water',
    icon: <Flame className="w-8 h-8 text-orange-500" />,
  },
  grass: {
    name: 'Grass',
    color: 'text-green-500',
    bgColor: 'bg-gradient-to-br from-green-500/20 to-emerald-500/10',
    borderColor: 'border-green-500/50',
    strongAgainst: 'Water',
    weakAgainst: 'Fire',
    icon: <Leaf className="w-8 h-8 text-green-500" />,
  },
  water: {
    name: 'Water',
    color: 'text-blue-500',
    bgColor: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10',
    borderColor: 'border-blue-500/50',
    strongAgainst: 'Fire',
    weakAgainst: 'Grass',
    icon: <Droplets className="w-8 h-8 text-blue-500" />,
  },
}

export function FareMonTypeSelectionScreen({ 
  playerId, 
  team, 
  opponentLocked,
  onSelectType, 
  onLockIn 
}: FareMonTypeSelectionScreenProps) {
  const canLockIn = team.selectedTypes.length === 2
  
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4">
        <h1 className="text-center text-lg font-bold text-white">Choose 2 FareMon Types</h1>
        <p className="mt-1 text-center text-xs text-white/60">Your opponent cannot see your choices</p>
      </div>
      
      {/* Type cards */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {(['fire', 'grass', 'water'] as FareMonType[]).map((type) => {
            const info = typeInfo[type]
            const isSelected = team.selectedTypes.includes(type)
            const isDisabled = team.locked || (!isSelected && team.selectedTypes.length >= 2)
            
            return (
              <motion.button
                key={type}
                whileTap={{ scale: team.locked ? 1 : 0.98 }}
                onClick={() => !team.locked && onSelectType(type)}
                disabled={isDisabled}
                className={`relative w-full rounded-xl p-4 transition-all ${info.bgColor} border-2 ${
                  isSelected 
                    ? `${info.borderColor} ring-2 ring-white/20` 
                    : 'border-white/10'
                } ${isDisabled && !isSelected ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
                    {info.icon}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 text-left">
                    <h3 className={`text-lg font-bold ${info.color}`}>{info.name}</h3>
                    <p className="text-xs text-white/60">
                      <span className="text-green-400">Strong vs {info.strongAgainst}</span>
                      {' / '}
                      <span className="text-red-400">Weak vs {info.weakAgainst}</span>
                    </p>
                  </div>
                  
                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00b14f]"
                      >
                        <Check className="h-5 w-5 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            )
          })}
        </div>
        
        {/* Selected types preview */}
        <div className="mt-6 rounded-xl bg-white/5 p-4 border border-white/10">
          <p className="mb-3 text-xs font-medium text-white/60 uppercase tracking-wider">Your Team</p>
          <div className="flex gap-3">
            {[0, 1].map((slot) => {
              const selectedType = team.selectedTypes[slot]
              const info = selectedType ? typeInfo[selectedType] : null
              
              return (
                <div
                  key={slot}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg p-3 border-2 border-dashed ${
                    info ? info.borderColor : 'border-white/20'
                  } ${info ? info.bgColor : 'bg-white/5'}`}
                >
                  {info ? (
                    <>
                      {info.icon}
                      <span className={`font-medium ${info.color}`}>{info.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-white/40">Slot {slot + 1}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Lock in button */}
      <div className="p-4 border-t border-white/10">
        {team.locked ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-[#00b14f]" />
              <span className="font-semibold text-white">Locked In</span>
            </div>
            <p className="text-sm text-white/60">
              {opponentLocked ? 'Starting battle...' : 'Waiting for opponent...'}
            </p>
            {!opponentLocked && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="mt-3 h-8 w-8 rounded-full border-2 border-[#00b14f] border-t-transparent"
              />
            )}
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: canLockIn ? 0.98 : 1 }}
            onClick={onLockIn}
            disabled={!canLockIn}
            className={`w-full rounded-xl py-4 font-semibold text-white transition-all ${
              canLockIn
                ? 'bg-[#00b14f] shadow-lg shadow-[#00b14f]/30 hover:bg-[#00923f]'
                : 'bg-white/10 cursor-not-allowed'
            }`}
          >
            {canLockIn ? 'Lock In Team' : `Select ${2 - team.selectedTypes.length} more type${team.selectedTypes.length === 1 ? '' : 's'}`}
          </motion.button>
        )}
      </div>
    </div>
  )
}
