'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Player } from '@/lib/grabble-types'

interface BookingConfirmationScreenProps {
  player: Player
  isWinner: boolean
  onReset: () => void
}

export function BookingConfirmationScreen({ player, isWinner, onReset }: BookingConfirmationScreenProps) {
  const [phase, setPhase] = useState<'searching' | 'found' | 'arriving'>('searching')
  
  const finalFare = isWinner ? player.winnerFare : player.loserFare
  const multiplier = isWinner ? '0.5x' : '1.5x'
  
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('found'), 2500)
    const timer2 = setTimeout(() => setPhase('arriving'), 4500)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e9ecef] px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <span className="font-semibold text-[#212529]">Booking Confirmed</span>
        </div>
        {/* Grabble badge */}
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${
          isWinner ? 'bg-[#e6f7ed]' : 'bg-[#fff0e6]'
        }`}>
          <span className="text-xs">⚔️</span>
          <span className={`text-xs font-medium ${isWinner ? 'text-[#00b14f]' : 'text-[#ff6b00]'}`}>
            Grabble {multiplier}
          </span>
        </div>
      </div>
      
      {/* Map area with driver */}
      <div className="relative h-[200px] bg-[#e8f4ea]">
        {/* Simple map background */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="200" fill="#e8f4ea" />
          <g stroke="#ffffff" strokeWidth="3" fill="none">
            <path d="M0 50 L400 50" />
            <path d="M0 100 L400 100" />
            <path d="M0 150 L400 150" />
            <path d="M80 0 L80 200" />
            <path d="M160 0 L160 200" />
            <path d="M240 0 L240 200" />
            <path d="M320 0 L320 200" />
          </g>
          
          {/* Route line */}
          <motion.path
            d="M50 150 Q100 100 200 100 T350 50"
            fill="none"
            stroke="#00b14f"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="8 8"
          />
          
          {/* Pickup marker */}
          <circle cx="50" cy="150" r="8" fill="#00b14f" />
          <circle cx="50" cy="150" r="4" fill="white" />
          
          {/* Destination marker */}
          <circle cx="350" cy="50" r="8" fill="#ff6b00" />
          <circle cx="350" cy="50" r="4" fill="white" />
        </svg>
        
        {/* Animated car */}
        <motion.div
          initial={{ left: '10%', top: '70%' }}
          animate={
            phase === 'searching' 
              ? { left: ['10%', '30%'], top: ['70%', '55%'] }
              : phase === 'found'
                ? { left: ['30%', '50%'], top: ['55%', '45%'] }
                : { left: '50%', top: '45%' }
          }
          transition={{ duration: 2, ease: 'easeInOut' }}
          className="absolute"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00b14f] shadow-lg">
            <span className="text-lg">🚗</span>
          </div>
        </motion.div>
      </div>
      
      {/* Driver card */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="-mt-5 mx-4 rounded-2xl bg-white p-4 shadow-xl"
      >
        {phase === 'searching' ? (
          <div className="flex flex-col items-center py-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="mb-3 h-12 w-12 rounded-full border-4 border-[#00b14f] border-t-transparent"
            />
            <p className="font-medium text-[#212529]">Finding your driver…</p>
            <p className="text-sm text-[#6c757d]">This usually takes less than 2 minutes</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Driver avatar */}
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-[#f1f3f5] flex items-center justify-center text-2xl">
                👤
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#00b14f] text-xs text-white">
                ★
              </div>
            </div>
            
            {/* Driver info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#212529]">Ahmad B.</p>
                <span className="rounded bg-[#f1f3f5] px-1.5 py-0.5 text-xs text-[#6c757d]">4.9 ★</span>
              </div>
              <p className="text-sm text-[#6c757d]">Silver Toyota Camry · SGX 1234 A</p>
            </div>
            
            {/* Contact buttons */}
            <div className="flex gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f3f5]">
                <svg className="h-5 w-5 text-[#6c757d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00b14f]">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {phase !== 'searching' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 border-t border-[#e9ecef] pt-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="h-2 w-2 rounded-full bg-[#00b14f]"
                />
                <span className="text-sm font-medium text-[#212529]">
                  {phase === 'found' ? 'Driver is on the way' : 'Arriving in 3 mins'}
                </span>
              </div>
              <span className="text-sm text-[#6c757d]">
                {phase === 'found' ? '5 mins away' : 'Almost there!'}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Trip details */}
      <div className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {/* Route */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full border-2 border-[#00b14f] bg-white" />
              <div className="my-1 h-8 w-0.5 bg-[#e9ecef]" />
              <div className="h-3 w-3 rounded-full bg-[#ff6b00]" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-[#6c757d]">Pickup</p>
                <p className="text-sm font-medium text-[#212529]">{player.pickup}</p>
              </div>
              <div>
                <p className="text-xs text-[#6c757d]">Drop-off</p>
                <p className="text-sm font-medium text-[#212529]">{player.destination}</p>
              </div>
            </div>
          </div>
          
          {/* Fare */}
          <div className="rounded-xl bg-[#f8f9fa] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6c757d]">Grabble Fare Applied</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${isWinner ? 'text-[#00b14f]' : 'text-[#ff6b00]'}`}>
                    ${finalFare.toFixed(2)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isWinner ? 'bg-[#e6f7ed] text-[#00b14f]' : 'bg-[#fff0e6] text-[#ff6b00]'
                  }`}>
                    {multiplier}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6c757d]">Normal fare</p>
                <p className="text-sm text-[#6c757d] line-through">${player.normalFare.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {/* Payment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-12 items-center justify-center rounded bg-[#1a1f71] text-xs font-bold text-white">
                VISA
              </div>
              <span className="text-sm text-[#212529]">•••• 1787</span>
            </div>
            <svg className="h-5 w-5 text-[#ced4da]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Bottom */}
      <div className="border-t border-[#e9ecef] p-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          className="w-full rounded-xl bg-[#f8f9fa] py-3.5 font-medium text-[#212529] transition-all hover:bg-[#e9ecef]"
        >
          Reset Demo
        </motion.button>
      </div>
    </div>
  )
}
