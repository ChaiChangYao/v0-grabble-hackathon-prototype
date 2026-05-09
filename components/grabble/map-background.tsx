'use client'

import { motion } from 'framer-motion'

interface MapBackgroundProps {
  pickup: string
  destination: string
  className?: string
}

export function MapBackground({ pickup, destination, className = '' }: MapBackgroundProps) {
  return (
    <div className={`relative overflow-hidden bg-[#e8f4ea] ${className}`}>
      {/* Singapore-style map with streets */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {/* Water areas */}
        <rect x="0" y="0" width="400" height="300" fill="#e8f4ea" />
        <path d="M0 280 Q100 260 200 270 T400 250 L400 300 L0 300 Z" fill="#cde5f4" opacity="0.5" />
        
        {/* Major roads */}
        <g stroke="#ffffff" strokeWidth="3" fill="none">
          {/* Horizontal roads */}
          <path d="M0 60 L400 60" />
          <path d="M0 120 L400 120" />
          <path d="M0 180 L400 180" />
          <path d="M0 240 L400 240" />
          
          {/* Vertical roads */}
          <path d="M60 0 L60 300" />
          <path d="M140 0 L140 300" />
          <path d="M220 0 L220 300" />
          <path d="M300 0 L300 300" />
          
          {/* Diagonal expressway */}
          <path d="M0 200 Q150 100 400 50" strokeWidth="5" stroke="#fff9e6" />
        </g>
        
        {/* Secondary roads */}
        <g stroke="#f5f5f5" strokeWidth="2" fill="none" opacity="0.7">
          <path d="M30 0 L30 300" />
          <path d="M100 0 L100 300" />
          <path d="M180 0 L180 300" />
          <path d="M260 0 L260 300" />
          <path d="M340 0 L340 300" />
          <path d="M0 30 L400 30" />
          <path d="M0 90 L400 90" />
          <path d="M0 150 L400 150" />
          <path d="M0 210 L400 210" />
        </g>
        
        {/* Building blocks */}
        <g fill="#d4e6d8" opacity="0.5">
          <rect x="65" y="65" width="30" height="50" rx="2" />
          <rect x="65" y="125" width="70" height="45" rx="2" />
          <rect x="145" y="65" width="70" height="50" rx="2" />
          <rect x="145" y="185" width="70" height="50" rx="2" />
          <rect x="225" y="125" width="70" height="50" rx="2" />
          <rect x="305" y="65" width="60" height="50" rx="2" />
          <rect x="305" y="185" width="60" height="50" rx="2" />
          <rect x="225" y="65" width="40" height="40" rx="2" />
        </g>
        
        {/* Park areas */}
        <g fill="#c5dfc9" opacity="0.6">
          <ellipse cx="180" cy="240" rx="40" ry="25" />
          <ellipse cx="80" cy="200" rx="25" ry="20" />
        </g>
        
        {/* Route line */}
        <motion.path
          d="M100 200 Q140 180 180 150 T280 100 T350 70"
          fill="none"
          stroke="#00b14f"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="300"
          initial={{ strokeDashoffset: 300 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        
        {/* Route dots */}
        <g fill="#00b14f">
          <motion.circle
            cx="100" cy="200" r="6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          />
          <motion.circle
            cx="350" cy="70" r="6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          />
        </g>
      </svg>
      
      {/* Location cards */}
      <div className="absolute left-4 top-4 right-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-lg"
        >
          <div className="flex flex-col items-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00b14f] text-xs font-bold text-white">
              1
            </div>
            <div className="my-1 h-4 w-0.5 bg-[#dee2e6]" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6b00] text-xs font-bold text-white">
              2
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-[#6c757d]">Pickup</p>
              <p className="text-sm font-medium text-[#212529]">{pickup}</p>
            </div>
            <div className="h-px bg-[#e9ecef]" />
            <div>
              <p className="text-xs text-[#6c757d]">Drop-off</p>
              <p className="text-sm font-medium text-[#212529]">{destination}</p>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f9fa]">
            <svg className="h-4 w-4 text-[#6c757d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </motion.div>
      </div>
      
      {/* GrabMaps attribution */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-white/80 px-2 py-0.5 text-xs text-[#6c757d]">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        GrabMaps
      </div>
    </div>
  )
}
