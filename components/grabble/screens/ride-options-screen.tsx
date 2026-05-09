'use client'

import { motion } from 'framer-motion'
import { MapBackground } from '../map-background'
import { Player } from '@/lib/grabble-types'
import { ChevronLeft, ChevronDown, Users, MoreHorizontal, Check, Sparkles, Route, Car, Gauge } from 'lucide-react'

type RideOptionId = 'grabble' | 'justgrab' | 'metered-taxi' | 'car-only'

interface RideOptionsScreenProps {
  player: Player
  selectedRideOption: RideOptionId
  onSelectRideOption: (option: RideOptionId) => void
  onStartGrabble: () => void
  onBookRide: () => void
  onBack: () => void
}

export function RideOptionsScreen({ 
  player, 
  selectedRideOption,
  onSelectRideOption,
  onStartGrabble,
  onBookRide,
  onBack 
}: RideOptionsScreenProps) {
  const rideOptions: Array<{
    id: RideOptionId
    name: string
    subtitle: string
    price: string
    eta: string
    capacity: number
    isGrabble?: boolean
    badges?: string[]
  }> = [
    {
      id: 'grabble',
      name: 'Grabble',
      subtitle: 'Battle for 0.5x fare',
      price: '',
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
    },
    {
      id: 'metered-taxi',
      name: 'Standard | Metered taxi',
      subtitle: "Previously 'Standard Taxi'",
      price: 'S$15.00-21.00',
      eta: '5 mins away',
      capacity: 4,
    },
    {
      id: 'car-only',
      name: 'Standard | Car only',
      subtitle: "Previously 'GrabCar'",
      price: 'S$19.00',
      eta: '5 mins away',
      capacity: 4,
    },
  ]

  const isGrabbleSelected = selectedRideOption === 'grabble'
  const ctaText = isGrabbleSelected ? 'Start Grabble Challenge' : 'Book Ride'
  const ctaDisabled = !selectedRideOption

  const handleCTAClick = () => {
    if (isGrabbleSelected) {
      onStartGrabble()
    } else {
      onBookRide()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* Header */}
      <div className="relative z-10 flex shrink-0 items-center justify-between px-4 py-3 bg-white">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-[#e9ecef]"
        >
          <ChevronLeft className="h-5 w-5 text-[#212529]" />
        </motion.button>
        <span className="font-semibold text-[#212529] text-sm tracking-wide uppercase">Singapore</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-[#e9ecef]"
        >
          <ChevronDown className="h-5 w-5 text-[#212529]" />
        </motion.button>
      </div>

      {/* Map */}
      <MapBackground
        pickup={player.pickup}
        destination={player.destination}
        className="h-[min(180px,28dvh)] shrink-0"
      />
      
      {/* Bottom sheet — min-h-0 so the list can shrink and scroll; CTA stays visible */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex min-h-0 flex-1 flex-col -mt-3 rounded-t-3xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-[#dee2e6]" />
        </div>
        
        {/* Ride options */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 pb-2">
          <div className="space-y-2.5">
            {rideOptions.map((option, index) => {
              const isSelected = selectedRideOption === option.id
              
              return (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectRideOption(option.id)}
                  className={`relative flex w-full items-center gap-3 rounded-xl p-3 transition-all ${
                    option.isGrabble
                      ? isSelected
                        ? 'bg-gradient-to-r from-[#e6f7ed] to-[#d4f0e0] ring-2 ring-[#00b14f] shadow-lg'
                        : 'bg-gradient-to-r from-[#f0faf4] to-[#e8f5ec] ring-1 ring-[#00b14f]/40'
                      : isSelected
                      ? 'bg-white ring-2 ring-[#00b14f] shadow-md'
                      : 'bg-white border border-[#e9ecef] hover:bg-[#f8f9fa]'
                  }`}
                >
                  {/* Vehicle icon */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    option.isGrabble ? 'bg-[#00b14f]' : 'bg-[#f1f3f5]'
                  }`}>
                    {option.isGrabble ? (
                      <motion.div
                        animate={isSelected ? { rotate: [0, 5, -5, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Route className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : option.id === 'metered-taxi' ? (
                      <Gauge className="h-6 w-6 text-[#00b14f]" />
                    ) : (
                      <Car className="h-6 w-6 text-[#00b14f]" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${option.isGrabble ? 'text-[#00923f]' : 'text-[#212529]'}`}>
                        {option.name}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-[#6c757d]">
                        <Users className="h-3 w-3" />
                        {option.capacity}
                      </span>
                    </div>
                    <p className="text-xs text-[#6c757d]">{option.eta}</p>
                    <p className="text-xs text-[#6c757d]">{option.subtitle}</p>
                    
                    {/* Grabble badges */}
                    {option.badges && (
                      <div className="mt-1.5 flex gap-1.5">
                        {option.badges.map((badge) => (
                          <span
                            key={badge}
                            className="inline-flex items-center gap-1 rounded-full bg-[#00b14f]/15 px-2 py-0.5 text-[10px] font-medium text-[#00923f]"
                          >
                            {badge === 'AI Matched' && (
                              <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                              </motion.div>
                            )}
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Price and checkmark */}
                  <div className="text-right flex flex-col items-end">
                    {option.isGrabble ? (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[#00923f]">
                          Win: ${player.winnerFare.toFixed(2)}
                        </p>
                        <p className="text-xs text-[#ff6b00]">
                          Lose: ${player.loserFare.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="font-bold text-[#212529]">{option.price}</p>
                    )}
                    
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-1.5 flex h-5 w-5 items-center justify-center rounded bg-[#00b14f]"
                      >
                        <Check className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
        
        {/* Bottom actions — always pinned above home indicator */}
        <div className="mt-auto shrink-0 border-t border-[#e9ecef] bg-white p-3 pb-3">
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
            onClick={handleCTAClick}
            disabled={ctaDisabled}
            className={`w-full rounded-xl py-3.5 font-semibold text-white shadow-lg transition-all ${
              ctaDisabled 
                ? 'bg-[#adb5bd] cursor-not-allowed shadow-none' 
                : 'bg-[#00b14f] shadow-[#00b14f]/30 hover:bg-[#00923f]'
            }`}
          >
            {ctaText}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
