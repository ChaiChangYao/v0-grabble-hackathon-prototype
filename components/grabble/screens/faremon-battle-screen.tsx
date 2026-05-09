'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  formatStages,
  moveSummaryLines,
  getSpriteForPerspective,
  type FareMonBattleState,
  type FareMonMove,
  type FareMon,
  type FareMonType,
} from '@/lib/faremon-engine'
import {
  ArrowRightLeft,
  Flame,
  Leaf,
  Droplets,
  Shield,
  Zap,
  Target,
  Sparkles,
  CircleDot,
  Snowflake,
  Wind,
  Mountain,
  Skull,
  Bug,
  Gem,
  Ghost,
  Moon,
  Eye,
  Sparkle,
  Activity,
} from 'lucide-react'

interface FareMonBattleScreenProps {
  playerId: 1 | 2
  state: FareMonBattleState
  onSelectMove: (move: FareMonMove) => void
  onSwitch: () => void
  waitingForOpponent: boolean
}

const TYPE_ACCENTS: Record<
  FareMonType,
  { bg: string; text: string; border: string }
> = {
  Normal: { bg: 'bg-stone-500/20', text: 'text-stone-300', border: 'border-stone-400/50' },
  Fire: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  Water: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/50' },
  Grass: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50' },
  Electric: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/50' },
  Ice: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-400/50' },
  Fighting: { bg: 'bg-red-700/20', text: 'text-red-400', border: 'border-red-500/50' },
  Poison: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  Ground: { bg: 'bg-amber-800/25', text: 'text-amber-400', border: 'border-amber-600/50' },
  Flying: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-400/50' },
  Psychic: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', border: 'border-fuchsia-500/50' },
  Bug: { bg: 'bg-lime-600/20', text: 'text-lime-400', border: 'border-lime-500/50' },
  Rock: { bg: 'bg-stone-600/25', text: 'text-stone-400', border: 'border-stone-500/50' },
  Ghost: { bg: 'bg-violet-900/30', text: 'text-violet-300', border: 'border-violet-500/50' },
  Dragon: { bg: 'bg-teal-600/25', text: 'text-teal-300', border: 'border-teal-500/50' },
  Dark: { bg: 'bg-slate-800/40', text: 'text-slate-300', border: 'border-slate-600/50' },
  Steel: { bg: 'bg-slate-400/15', text: 'text-slate-300', border: 'border-slate-400/50' },
  Fairy: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-400/50' },
}

const TYPE_ICONS: Record<FareMonType, React.ReactNode> = {
  Normal: <CircleDot className="h-3.5 w-3.5" />,
  Fire: <Flame className="h-3.5 w-3.5" />,
  Water: <Droplets className="h-3.5 w-3.5" />,
  Grass: <Leaf className="h-3.5 w-3.5" />,
  Electric: <Zap className="h-3.5 w-3.5" />,
  Ice: <Snowflake className="h-3.5 w-3.5" />,
  Fighting: <Activity className="h-3.5 w-3.5" />,
  Poison: <Skull className="h-3.5 w-3.5" />,
  Ground: <Mountain className="h-3.5 w-3.5" />,
  Flying: <Wind className="h-3.5 w-3.5" />,
  Psychic: <Eye className="h-3.5 w-3.5" />,
  Bug: <Bug className="h-3.5 w-3.5" />,
  Rock: <Gem className="h-3.5 w-3.5" />,
  Ghost: <Ghost className="h-3.5 w-3.5" />,
  Dragon: <Sparkles className="h-3.5 w-3.5" />,
  Dark: <Moon className="h-3.5 w-3.5" />,
  Steel: <Shield className="h-3.5 w-3.5" />,
  Fairy: <Sparkle className="h-3.5 w-3.5" />,
}

function TypeBadges({
  primary,
  secondary,
  compact,
}: {
  primary: FareMonType
  secondary?: FareMonType | null
  compact?: boolean
}) {
  const sizes = compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
  return (
    <div className="flex flex-wrap gap-1">
      {[primary, secondary].filter(Boolean).map((t) => {
        const a = TYPE_ACCENTS[t as FareMonType]
        return (
          <span
            key={t}
            className={`inline-flex items-center gap-0.5 rounded-full font-medium ${a.bg} ${a.text} border ${a.border} ${sizes}`}
          >
            {TYPE_ICONS[t as FareMonType]}
            {t}
          </span>
        )
      })}
    </div>
  )
}

function StatStagesRow({ faremon, isOpponent }: { faremon: FareMon; isOpponent: boolean }) {
  const t = formatStages(faremon)
  if (!t) return null
  return (
    <p className={`text-[9px] text-white/50 ${isOpponent ? 'text-right' : ''}`}>
      Stages: {t}
    </p>
  )
}

function StatusBadge({ faremon }: { faremon: FareMon }) {
  if (!faremon.majorStatus) return null
  return (
    <span className="inline-flex rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200">
      {faremon.majorStatus}
      {faremon.majorStatus === 'Sleep' && faremon.sleepTurnsRemaining > 0
        ? ` (${faremon.sleepTurnsRemaining})`
        : ''}
    </span>
  )
}

function CreaturePanel({
  viewerPlayerId,
  faremon,
  isOpponent,
  showTypes,
}: {
  viewerPlayerId: 1 | 2
  faremon: FareMon
  isOpponent: boolean
  showTypes: boolean
}) {
  const hpPercent = (faremon.currentHP / faremon.maxHP) * 100
  const hpColor = hpPercent > 50 ? '#00b14f' : hpPercent > 25 ? '#ff6b00' : '#dc3545'
  const typeColor = TYPE_ACCENTS[faremon.primaryType]
  const ownerId = isOpponent ? (viewerPlayerId === 1 ? 2 : 1) : viewerPlayerId
  const spriteUrl = getSpriteForPerspective(viewerPlayerId, ownerId, faremon)
  const dp = faremon.dpsProfile

  return (
    <motion.div
      initial={{ opacity: 0, x: isOpponent ? 12 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex flex-col gap-1 ${isOpponent ? 'items-end text-right' : 'items-start text-left'}`}
    >
      <div className={`relative flex ${isOpponent ? 'justify-end' : 'justify-start'}`}>
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border ${typeColor.bg} ${typeColor.border}`}
        >
          {spriteUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URLs from AI
            <img src={spriteUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className={`text-xl font-bold ${typeColor.text}`}>{faremon.name.charAt(0)}</span>
          )}
        </motion.div>
      </div>

      <div className="max-w-[220px] space-y-1">
        {showTypes && <TypeBadges primary={faremon.primaryType} secondary={faremon.secondaryType} />}
        <div className={`flex flex-wrap items-center gap-2 ${isOpponent ? 'justify-end' : ''}`}>
          <span className="text-sm font-bold leading-tight text-white">{faremon.name}</span>
          <StatusBadge faremon={faremon} />
        </div>
        {faremon.playstyle && (
          <p className={`text-[9px] italic text-white/45 ${isOpponent ? 'text-right' : ''}`}>
            {faremon.playstyle}
          </p>
        )}
        {dp && (
          <div
            className={`flex flex-wrap gap-1 text-[8px] text-white/55 ${isOpponent ? 'justify-end' : ''}`}
          >
            <span>Burst {dp.burst}</span>
            <span>·</span>
            <span>Ctrl {dp.control}</span>
            <span>·</span>
            <span>Spd {dp.speed}</span>
            <span>·</span>
            <span>Def {dp.defense}</span>
          </div>
        )}
        <div
          className={`flex items-center gap-2 ${isOpponent ? 'flex-row-reverse' : ''}`}
        >
          <span className="text-[10px] font-medium text-white/75">
            {faremon.currentHP}/{faremon.maxHP}
          </span>
          <div className="h-2 min-w-[72px] flex-1 overflow-hidden rounded-full bg-black/40">
            <motion.div
              animate={{ width: `${hpPercent}%` }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="h-full rounded-full"
              style={{ backgroundColor: hpColor }}
            />
          </div>
        </div>
        <p className={`text-[10px] text-white/60 ${isOpponent ? 'text-right' : ''}`}>
          ATK {faremon.attack} · DEF {faremon.defense} · SPD {faremon.speed}
        </p>
        <StatStagesRow faremon={faremon} isOpponent={isOpponent} />
      </div>
    </motion.div>
  )
}

function MoveButton({
  move,
  onClick,
  disabled,
  selected,
}: {
  move: FareMonMove
  onClick: () => void
  disabled: boolean
  selected: boolean
}) {
  const typeColor = TYPE_ACCENTS[move.type]
  const lines = moveSummaryLines(move)
  const effectHint = lines.filter(Boolean).slice(0, 2)

  return (
    <motion.button
      type="button"
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex min-h-[76px] flex-col overflow-hidden rounded-xl border p-2 text-left transition-all ${typeColor.bg} ${
        selected ? `${typeColor.border} ring-2 ring-[#00b14f]/60` : 'border-white/10'
      } ${disabled ? 'opacity-45' : 'hover:border-white/25'}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[11px] font-bold leading-snug text-white line-clamp-2">{move.name}</span>
        <span className={`shrink-0 ${typeColor.text}`}>{TYPE_ICONS[move.type]}</span>
      </div>
      <p className="mt-0.5 text-[9px] font-medium text-white/55">
        {move.type} · {move.category}
      </p>
      {effectHint.map((ln) => (
        <p key={ln} className="text-[9px] leading-tight text-white/50 line-clamp-2">
          {ln}
        </p>
      ))}
    </motion.button>
  )
}

export function FareMonBattleScreen({
  playerId,
  state,
  onSelectMove,
  onSwitch,
  waitingForOpponent,
}: FareMonBattleScreenProps) {
  const [selectedMove, setSelectedMove] = useState<FareMonMove | null>(null)

  const playerTeam = playerId === 1 ? state.player1Team : state.player2Team
  const opponentTeam = playerId === 1 ? state.player2Team : state.player1Team

  const playerActive = playerTeam.activeFareMonIndex === 0 ? playerTeam.faremon1 : playerTeam.faremon2
  const opponentActive =
    opponentTeam.activeFareMonIndex === 0 ? opponentTeam.faremon1 : opponentTeam.faremon2
  const playerReserve = playerTeam.activeFareMonIndex === 0 ? playerTeam.faremon2 : playerTeam.faremon1

  const hasSelectedMove = playerId === 1 ? state.player1SelectedMove !== null : state.player2SelectedMove !== null
  const canSwitch = playerReserve && playerReserve.currentHP > 0 && playerActive && playerActive.currentHP > 0

  if (!playerActive || !opponentActive) return null

  const handleConfirmMove = () => {
    if (selectedMove) {
      onSelectMove(selectedMove)
      setSelectedMove(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-[#121a14] via-[#0f1729] to-[#0b1026]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[#00b14f]" />
          <span className="text-sm font-semibold text-white">FareMon Duel</span>
        </div>
        <div className="rounded-full bg-black/35 px-2.5 py-0.5">
          <span className="text-[10px] text-white/70">Turn </span>
          <span className="text-xs font-bold text-white">
            {state.currentTurn}/{state.maxTurns}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <section className="relative min-h-0 flex-1 overflow-hidden px-2 pt-2">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-1/4 top-1/4 h-24 w-24 rounded-full bg-[#00b14f]/10 blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full bg-[#ff6b00]/10 blur-3xl" />
          </div>

          <div className="relative flex h-full min-h-0 flex-col gap-1">
            <div className="shrink-0 space-y-1">
              <CreaturePanel viewerPlayerId={playerId} faremon={opponentActive} isOpponent showTypes />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-black/25 p-1.5">
              <div className="flex h-full max-h-[120px] flex-col gap-1 overflow-y-auto sm:max-h-[140px]">
                {state.battleLog.slice(-6).map((log, i) => (
                  <motion.p
                    key={`${i}-${log.slice(0, 24)}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] leading-snug text-white/65"
                  >
                    {log}
                  </motion.p>
                ))}
              </div>
              {state.effectivenessMessage && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-1 text-[11px] font-bold ${
                    state.effectivenessMessage.includes('Super')
                      ? 'text-[#4ade80]'
                      : state.effectivenessMessage.includes('Not very') || state.effectivenessMessage.includes('No effect')
                        ? 'text-red-300'
                        : state.effectivenessMessage.includes('Miss')
                          ? 'text-white/50'
                          : 'text-white/85'
                  }`}
                >
                  {state.effectivenessMessage}
                </motion.p>
              )}
            </div>

            <div className="shrink-0 space-y-1 pb-1">
              <CreaturePanel viewerPlayerId={playerId} faremon={playerActive} isOpponent={false} showTypes />
              {canSwitch && !(waitingForOpponent || hasSelectedMove) && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={onSwitch}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 py-1.5 text-[11px] font-medium text-white/85"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Switch FareMon
                </motion.button>
              )}
            </div>
          </div>
        </section>

        <footer className="relative z-20 shrink-0 border-t border-white/15 bg-[#0e1419]/95 px-2 pb-2 pt-1.5 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md">
          {waitingForOpponent || hasSelectedMove ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                className="mb-2 h-8 w-8 rounded-full border-2 border-[#00b14f] border-t-transparent"
              />
              <p className="text-sm font-medium text-white">Waiting for opponent</p>
              <p className="text-xs text-white/55">Move locked in</p>
            </motion.div>
          ) : (
            <>
              <p className="mb-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-white/45">
                Battle tray · pick a move
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {playerActive.moves.map((move) => (
                  <MoveButton
                    key={move.id}
                    move={move}
                    onClick={() => setSelectedMove(move)}
                    disabled={hasSelectedMove}
                    selected={selectedMove?.id === move.id}
                  />
                ))}
              </div>
              <AnimatePresence>
                {selectedMove && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleConfirmMove}
                    className="mt-2 w-full rounded-xl bg-[#00b14f] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00b14f]/25"
                  >
                    Confirm Move
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
