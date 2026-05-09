'use client'

import { motion } from 'framer-motion'
import { MapBackground } from '../map-background'
import { Player } from '@/lib/grabble-types'

interface HomeScreenProps {
  player: Player
  onContinue: () => void
}

export function HomeScreen({ player, onContinue }: HomeScreenProps) {
  const services = [
    { icon: '🚗', label: 'Car', color: '#00b14f' },
    { icon: '🏍️', label: 'Bike', color: '#00b14f' },
    { icon: '🍔', label: 'Food', color: '#ff6b00' },
    { icon: '📦', label: 'Mart', color: '#00b14f' },
    { icon: '💳', label: 'Pay', color: '#00b14f' },
  ]

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Map section */}
      <MapBackground
        pickup={player.pickup}
        destination={player.destination}
        className="h-[280px]"
      />
      
      {/* Bottom sheet */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 -mt-4 rounded-t-3xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-[#dee2e6]" />
        </div>
        
        {/* Search bar */}
        <div className="px-4 py-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onContinue}
            className="flex w-full items-center gap-3 rounded-xl bg-[#f8f9fa] px-4 py-3.5 shadow-sm transition-all hover:bg-[#f1f3f5]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00b14f]">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <span className="text-[#6c757d]">Where to?</span>
            <div className="ml-auto flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
              <svg className="h-4 w-4 text-[#00b14f]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="4" />
              </svg>
              <span className="text-sm font-medium text-[#212529]">Now</span>
              <svg className="h-3 w-3 text-[#6c757d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </motion.button>
        </div>
        
        {/* Services */}
        <div className="px-4 py-4">
          <div className="flex justify-between">
            {services.map((service, index) => (
              <motion.button
                key={service.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f9fa] shadow-sm">
                  <span className="text-2xl">{service.icon}</span>
                </div>
                <span className="text-xs font-medium text-[#495057]">{service.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Recent places */}
        <div className="px-4 py-2">
          <h3 className="mb-3 text-sm font-semibold text-[#212529]">Recent places</h3>
          <div className="space-y-2">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinue}
              className="flex w-full items-center gap-3 rounded-xl p-3 transition-colors hover:bg-[#f8f9fa]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f3f5]">
                <svg className="h-5 w-5 text-[#6c757d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-[#212529]">{player.destination}</p>
                <p className="text-sm text-[#6c757d]">Singapore</p>
              </div>
              <svg className="h-5 w-5 text-[#ced4da]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </div>
        
        {/* Promo banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mx-4 mt-2 rounded-xl bg-gradient-to-r from-[#00b14f] to-[#00923f] p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/80">New Feature</p>
              <p className="font-semibold text-white">Try Grabble & save 50%</p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-3xl"
            >
              🎮
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
