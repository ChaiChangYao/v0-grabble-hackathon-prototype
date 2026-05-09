'use client'

import { motion } from 'framer-motion'

interface PhoneFrameProps {
  children: React.ReactNode
  playerName: string
  playerId: 1 | 2
}

export function PhoneFrame({ children, playerName, playerId }: PhoneFrameProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: playerId === 1 ? 0 : 0.15 }}
      className="flex flex-col items-center"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${playerId === 1 ? 'bg-[#00b14f]' : 'bg-[#ff6b00]'}`} />
        <span className="text-sm font-medium text-[#495057]">Player {playerId}: {playerName}</span>
      </div>

      <div className="relative shrink-0">
        {/* iPhone 15 class device: 393 × 852 pt portrait — fixed height (no 100dvh min() squeeze) */}
        <div className="relative w-[393px] rounded-[50px] bg-[#1a1a1a] p-3 shadow-2xl">
          <div className="relative flex h-[852px] flex-col overflow-hidden rounded-[38px] bg-black">
            <div className="relative flex h-11 shrink-0 items-center justify-between bg-[#0d1117] px-6">
              <span className="text-sm font-semibold text-white/90">9:41</span>
              <div className="absolute left-1/2 top-[18px] h-[26px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
              <div className="flex items-center gap-1 text-white/80">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9V6.5c1.52-.5 3.15-.5 4.67 0v2.33c0 .4.23.74.56.9.97.49 1.87 1.12 2.66 1.85.18.17.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71 0-.28-.11-.53-.29-.71C20.66 4.78 16.54 3 12 3z" />
                </svg>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                </svg>
                <div className="flex h-4 w-7 items-center rounded-sm border border-white/50 px-0.5">
                  <div className="h-2.5 w-full rounded-sm bg-[#00b14f]" />
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0b0f14]">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
            </div>

            <div className="flex h-7 shrink-0 items-center justify-center bg-[#0b0f14] pb-1">
              <div className="h-1 w-28 rounded-full bg-white/25" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
