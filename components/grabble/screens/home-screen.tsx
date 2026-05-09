'use client'

import { motion } from 'framer-motion'
import { MapBackground } from '../map-background'
import { Player } from '@/lib/grabble-types'
import { Car, Bike, ShoppingBag, CreditCard, Utensils, Clock, ChevronRight, Search } from 'lucide-react'

interface HomeScreenProps {
  player: Player
  onContinue: () => void
}

export function HomeScreen({ player, onContinue }: HomeScreenProps) {
  const services = [
    { icon: Car, label: 'Car', color: '#00b14f' },
    { icon: Bike, label: 'Bike', color: '#00b14f' },
    { icon: Utensils, label: 'Food', color: '#ff6b00' },
    { icon: ShoppingBag, label: 'Mart', color: '#00b14f' },
    { icon: CreditCard, label: 'Pay', color: '#00b14f' },
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
              <Search className="h-4 w-4 text-white" />
            </div>
            <span className="text-[#6c757d]">Where to?</span>
            <div className="ml-auto flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-[#00b14f]" />
              <span className="text-sm font-medium text-[#212529]">Now</span>
              <ChevronRight className="h-3 w-3 text-[#6c757d]" />
            </div>
          </motion.button>
        </div>
        
        {/* Services */}
        <div className="px-4 py-4">
          <div className="flex justify-between">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.button
                  key={service.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div 
                    className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
                    style={{ backgroundColor: `${service.color}15` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: service.color }} />
                  </div>
                  <span className="text-xs font-medium text-[#495057]">{service.label}</span>
                </motion.button>
              )
            })}
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
                <Clock className="h-5 w-5 text-[#6c757d]" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-[#212529]">{player.destination}</p>
                <p className="text-sm text-[#6c757d]">Singapore</p>
              </div>
              <ChevronRight className="h-5 w-5 text-[#ced4da]" />
            </motion.button>
          </div>
        </div>
        
        {/* Promo banner - Clean illustration style */}
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
            {/* Clean illustration instead of emoji */}
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="16" cy="16" r="10" />
                <path d="M12 16h8M16 12v8" strokeLinecap="round" />
                <circle cx="12" cy="16" r="2" fill="currentColor" stroke="none" />
                <circle cx="20" cy="16" r="2" fill="currentColor" stroke="none" />
              </svg>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
