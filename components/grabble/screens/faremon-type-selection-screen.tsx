'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ALL_FAREMON_TYPES, type FareMonType, type FareMonTeam } from '@/lib/faremon-engine'
import { Check, Lock, Search } from 'lucide-react'
import {
  CircleDot,
  Flame,
  Leaf,
  Droplets,
  Zap,
  Snowflake,
  Activity,
  Skull,
  Mountain,
  Wind,
  Eye,
  Bug,
  Gem,
  Ghost,
  Sparkles,
  Moon,
  Shield,
  Sparkle,
} from 'lucide-react'

interface FareMonTypeSelectionScreenProps {
  playerId: 1 | 2
  team: FareMonTeam
  opponentLocked: boolean
  isGenerating?: boolean
  onSelectType: (type: FareMonType) => void
  onLockIn: () => void | Promise<void>
}

const TYPE_IDENTITY: Record<FareMonType, string> = {
  Normal: 'Balanced and reliable',
  Fire: 'High pressure offense',
  Water: 'Flexible and stable',
  Grass: 'Control and recovery',
  Electric: 'Fast disruption',
  Ice: 'Burst damage',
  Fighting: 'Physical pressure',
  Poison: 'Damage over time',
  Ground: 'Heavy counters',
  Flying: 'Speed and evasion',
  Psychic: 'Accuracy and control',
  Bug: 'Utility and tempo',
  Rock: 'Defense and heavy hits',
  Ghost: 'Trick moves',
  Dragon: 'High-risk power',
  Dark: 'Debuffs and disruption',
  Steel: 'Defense and resistance',
  Fairy: 'Anti-power control',
}

const CARD: Record<
  FareMonType,
  { color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  Normal: { color: 'text-stone-200', bg: 'from-stone-700/30 to-stone-900/20', border: 'border-stone-500/40', icon: <CircleDot className="h-7 w-7 text-stone-300" /> },
  Fire: { color: 'text-orange-400', bg: 'from-orange-600/25 to-red-900/20', border: 'border-orange-500/45', icon: <Flame className="h-7 w-7 text-orange-400" /> },
  Water: { color: 'text-sky-400', bg: 'from-sky-600/25 to-blue-900/20', border: 'border-sky-500/45', icon: <Droplets className="h-7 w-7 text-sky-400" /> },
  Grass: { color: 'text-emerald-400', bg: 'from-emerald-600/25 to-green-900/20', border: 'border-emerald-500/45', icon: <Leaf className="h-7 w-7 text-emerald-400" /> },
  Electric: { color: 'text-yellow-300', bg: 'from-yellow-600/25 to-amber-900/20', border: 'border-yellow-500/45', icon: <Zap className="h-7 w-7 text-yellow-300" /> },
  Ice: { color: 'text-cyan-300', bg: 'from-cyan-600/25 to-slate-900/20', border: 'border-cyan-400/45', icon: <Snowflake className="h-7 w-7 text-cyan-300" /> },
  Fighting: { color: 'text-red-400', bg: 'from-red-700/30 to-stone-900/20', border: 'border-red-600/45', icon: <Activity className="h-7 w-7 text-red-400" /> },
  Poison: { color: 'text-purple-400', bg: 'from-purple-700/30 to-slate-900/20', border: 'border-purple-500/45', icon: <Skull className="h-7 w-7 text-purple-400" /> },
  Ground: { color: 'text-amber-400', bg: 'from-amber-800/35 to-stone-900/30', border: 'border-amber-600/45', icon: <Mountain className="h-7 w-7 text-amber-400" /> },
  Flying: { color: 'text-indigo-300', bg: 'from-indigo-700/25 to-slate-900/20', border: 'border-indigo-500/45', icon: <Wind className="h-7 w-7 text-indigo-300" /> },
  Psychic: { color: 'text-fuchsia-300', bg: 'from-fuchsia-700/25 to-slate-900/20', border: 'border-fuchsia-500/45', icon: <Eye className="h-7 w-7 text-fuchsia-300" /> },
  Bug: { color: 'text-lime-400', bg: 'from-lime-800/25 to-stone-900/20', border: 'border-lime-600/45', icon: <Bug className="h-7 w-7 text-lime-400" /> },
  Rock: { color: 'text-stone-400', bg: 'from-stone-600/35 to-neutral-900/20', border: 'border-stone-500/45', icon: <Gem className="h-7 w-7 text-stone-400" /> },
  Ghost: { color: 'text-violet-300', bg: 'from-violet-900/35 to-slate-950/40', border: 'border-violet-500/45', icon: <Ghost className="h-7 w-7 text-violet-300" /> },
  Dragon: { color: 'text-teal-300', bg: 'from-teal-700/30 to-slate-900/20', border: 'border-teal-500/45', icon: <Sparkles className="h-7 w-7 text-teal-300" /> },
  Dark: { color: 'text-slate-300', bg: 'from-slate-900/50 to-black/40', border: 'border-slate-600/45', icon: <Moon className="h-7 w-7 text-slate-300" /> },
  Steel: { color: 'text-slate-200', bg: 'from-slate-500/20 to-slate-900/30', border: 'border-slate-400/45', icon: <Shield className="h-7 w-7 text-slate-300" /> },
  Fairy: { color: 'text-pink-300', bg: 'from-pink-600/25 to-rose-900/20', border: 'border-pink-400/45', icon: <Sparkle className="h-7 w-7 text-pink-300" /> },
}

export function FareMonTypeSelectionScreen({
  playerId,
  team,
  opponentLocked,
  isGenerating = false,
  onSelectType,
  onLockIn,
}: FareMonTypeSelectionScreenProps) {
  const [q, setQ] = useState('')
  const canLockIn = team.selectedTypes.length === 2

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return ALL_FAREMON_TYPES
    return ALL_FAREMON_TYPES.filter(
      (t) =>
        t.toLowerCase().includes(s) ||
        TYPE_IDENTITY[t].toLowerCase().includes(s),
    )
  }, [q])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-[#121a14] via-[#0f1729] to-[#0b1026]">
      <header className="shrink-0 border-b border-white/10 px-3 py-3">
        <h1 className="text-center text-base font-bold text-white">Pick 2 FareMon types</h1>
        <p className="mt-1 text-center text-[11px] text-white/55">
          Player {playerId} · Rival&apos;s picks stay hidden until battle
        </p>
        <div className="relative mx-auto mt-3 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter types…"
            className="w-full rounded-lg border border-white/10 bg-black/35 py-2 pl-8 pr-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#00b14f]/60"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 pt-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          {filtered.map((type) => {
            const info = CARD[type]
            const isSelected = team.selectedTypes.includes(type)
            const isDisabled = team.locked || isGenerating || (!isSelected && team.selectedTypes.length >= 2)

            return (
              <motion.button
                type="button"
                key={type}
                whileTap={{ scale: team.locked ? 1 : 0.98 }}
                onClick={() => !team.locked && onSelectType(type)}
                disabled={isDisabled}
                className={`relative flex flex-col rounded-xl border bg-gradient-to-br p-2.5 text-left transition-all ${info.bg} ${
                  isSelected ? `${info.border} ring-2 ring-[#00b14f]/40` : 'border-white/10'
                } ${isDisabled && !isSelected ? 'opacity-40' : ''}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={`text-sm font-bold leading-tight ${info.color}`}>{type}</span>
                    <span className="line-clamp-2 text-[10px] leading-snug text-white/55">
                      {TYPE_IDENTITY[type]}
                    </span>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/25">
                    {info.icon}
                  </div>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#00b14f]"
                    >
                      <Check className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/45">
            Your team
          </p>
          <div className="flex gap-2">
            {[0, 1].map((slot) => {
              const selectedType = team.selectedTypes[slot]
              const info = selectedType ? CARD[selectedType] : null
              return (
                <div
                  key={slot}
                  className={`flex min-h-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-2 ${
                    info ? `${info.border} bg-black/20` : 'border-white/15'
                  }`}
                >
                  {info && selectedType ? (
                    <>
                      {info.icon}
                      <span className={`text-xs font-semibold ${info.color}`}>{selectedType}</span>
                    </>
                  ) : (
                    <span className="text-[11px] text-white/35">Slot {slot + 1}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-[#0e1419]/95 px-3 py-3 backdrop-blur">
        {team.locked ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-2">
            <div className="mb-1 flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#00b14f]" />
              <span className="font-semibold text-white">Locked in</span>
            </div>
            <p className="text-center text-xs text-white/55">
              {opponentLocked ? 'Starting battle…' : 'Waiting for rival…'}
            </p>
            {!opponentLocked && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="mt-2 h-7 w-7 rounded-full border-2 border-[#00b14f] border-t-transparent"
              />
            )}
          </motion.div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="h-8 w-8 rounded-full border-2 border-[#00b14f] border-t-transparent"
            />
            <p className="text-center text-sm font-medium text-white">Summoning FareMons…</p>
            <p className="text-center text-[11px] text-white/50">AI is building your team for this match</p>
          </div>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: canLockIn ? 0.98 : 1 }}
            onClick={() => void onLockIn()}
            disabled={!canLockIn}
            className={`w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all ${
              canLockIn
                ? 'bg-[#00b14f] shadow-lg shadow-[#00b14f]/20 hover:bg-[#009a45]'
                : 'cursor-not-allowed bg-white/10 text-white/45'
            }`}
          >
            {canLockIn
              ? 'Lock in team'
              : `Select ${2 - team.selectedTypes.length} more type${team.selectedTypes.length === 1 ? '' : 's'}`}
          </motion.button>
        )}
      </div>
    </div>
  )
}
