'use client'

import { motion } from 'framer-motion'
import { MapBackground } from '../map-background'
import { Player } from '@/lib/grabble-types'
import { ChevronLeft, ChevronDown, Users, Swords, Sparkles, MoreHorizontal, Check } from 'lucide-react'

interface RideOptionsScreenProps {
  player: Player
  onSelectGrabble: () => void
  onBack: () => void
}

export function RideOptionsScreen({ player, onSelectGrabble, onBack }: RideOptionsScreenProps) {
  const rideOptions = [
    {
      id: 'grabble',
      name: 'Grabble',
      subtitle: 'Battle for 0.5x fare',
      price: `Win: $${player.winnerFare.toFixed(2)} / Lose: $${player.loserFare.toFixed(2)}`,
      eta: '3 mins away',
      capacity: 4,
      isGrabble: true,
      badges: ['AI Matched', 'Competitive'],
    },
    {
      id: 'justgrab',
      name: 'Standard (JustGrab)',
      subtitle: 'Grab now while the fare is low',
      price: `S$${player.normalFare.toFixed(2)}`,
      eta: '5 mins away',
      capacity: 4,
      isSelected: true,
    },
    {
      id: 'standard-taxi',
      name: 'Standard | Metered taxi',
      subtitle: "Previously 'Standard Taxi'",
      price: 'S$15.00-21.00',
      eta: '5 mins away',
      capacity: 4,
    },
    {
      id: 'grabcar',
      name: 'Standard | Car only',
      subtitle: "Previously 'GrabCar'",
      price: 'S$19.00',
      eta: '5 mins away',
      capacity: 4,
    },
  ]

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-white">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
        >
          <ChevronLeft className="h-5 w-5 text-[#212529]" />
        </motion.button>
        <span className="font-semibold text-[#212529] text-sm tracking-wide uppercase">Singapore</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
        >
          <ChevronDown className="h-5 w-5 text-[#212529]" />
        </motion.button>
      </div>

      {/* Map */}
      <MapBackground
        pickup={player.pickup}
        destination={player.destination}
        className="h-[200px]"
      />
      
      {/* Bottom sheet */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 -mt-3 rounded-t-3xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-[#dee2e6]" />
        </div>
        
        {/* Ride options */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {rideOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileTap={{ scale: 0.98 }}
                onClick={option.isGrabble ? onSelectGrabble : undefined}
                className={`relative flex w-full items-center gap-3 rounded-xl p-3 transition-all ${
                  option.isGrabble
                    ? 'bg-gradient-to-r from-[#e6f7ed] to-[#d4f0e0] ring-2 ring-[#00b14f] shadow-lg'
                    : option.isSelected
                    ? 'bg-white ring-2 ring-[#00b14f]'
                    : 'bg-white hover:bg-[#f8f9fa]'
                }`}
              >
                {/* Vehicle icon */}
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  option.isGrabble ? 'bg-[#00b14f]' : 'bg-[#f1f3f5]'
                }`}>
                  {option.isGrabble ? (
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Swords className="w-6 h-6 text-white" />
                    </motion.div>
                  ) : (
                    <svg className="h-6 w-6 text-[#00b14f]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                    </svg>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${option.isGrabble ? 'text-[#00923f]' : 'text-[#212529]'}`}>
                      {option.name}
                    </span>
                    {option.capacity && (
                      <span className="flex items-center gap-0.5 text-xs text-[#6c757d]">
                        <Users className="h-3 w-3" />
                        {option.capacity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6c757d]">{option.eta}</p>
                  <p className="text-xs text-[#6c757d]">{option.subtitle}</p>
                  
                  {/* Grabble badges */}
                  {option.badges && (
                    <div className="mt-1.5 flex gap-1.5">
                      {option.badges.map((badge) => (
                        <span
                          key={badge}
                          className="inline-flex items-center gap-1 rounded-full bg-[#00b14f]/20 px-2 py-0.5 text-[10px] font-medium text-[#00923f]"
                        >
                          {badge === 'AI Matched' && (
                            <motion.div
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                              <Sparkles className="w-3 h-3" />
                            </motion.div>
                          )}
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Price */}
                <div className="text-right">
                  <p className={`font-bold ${option.isGrabble ? 'text-[#00923f]' : 'text-[#212529]'}`}>
                    {option.isGrabble ? '' : option.price}
                  </p>
                  {option.isGrabble && (
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#00923f]">
                        Win: ${player.winnerFare.toFixed(2)}
                      </p>
                      <p className="text-xs text-[#ff6b00]">
                        Lose: ${player.loserFare.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {option.isSelected && !option.isGrabble && (
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded bg-[#00b14f] ml-auto">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Bottom actions */}
        <div className="border-t border-[#e9ecef] bg-white p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-10 items-center justify-center rounded bg-[#1a1f71] text-xs font-bold text-white">
                VISA
              </div>
              <span className="text-[#212529]">1787</span>
            </div>
            <span className="text-[#6c757d]">Offers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f3f5]">
              <MoreHorizontal className="h-4 w-4 text-[#6c757d]" />
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSelectGrabble}
            className="w-full rounded-xl bg-[#00b14f] py-3.5 font-semibold text-white shadow-lg shadow-[#00b14f]/30 transition-all hover:bg-[#00923f]"
          >
            Book Grabble
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
