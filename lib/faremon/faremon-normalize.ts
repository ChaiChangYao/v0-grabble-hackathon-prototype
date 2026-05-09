import type {
  DpsProfile,
  FareMon,
  FareMonMove,
  FareMonType,
  MajorStatus,
  MoveCategory,
  MoveDpsRole,
  StatChanges,
} from './types'
import { ALL_FAREMON_TYPES } from './type-chart'
import { intRange, pickSeeded } from './seeded-random'

const MOVE_CATS: MoveCategory[] = [
  'Damage',
  'Stat Boost',
  'Stat Debuff',
  'Status',
  'Shield',
  'Recovery',
  'Setup',
  'Disruption',
]

function isFareMonType(s: string): s is FareMonType {
  return (ALL_FAREMON_TYPES as readonly string[]).includes(s)
}

export function parseFareMonType(s: unknown, fallback: FareMonType): FareMonType {
  if (typeof s !== 'string') return fallback
  const t = s.trim() as FareMonType
  return isFareMonType(t) ? t : fallback
}

function parseCategory(s: unknown): MoveCategory {
  if (typeof s !== 'string') return 'Damage'
  const c = s.trim()
  return (MOVE_CATS as readonly string[]).includes(c) ? (c as MoveCategory) : 'Damage'
}

function parseMajorStatus(s: unknown): MajorStatus | undefined {
  if (s === null || s === undefined || s === 'None') return undefined
  if (typeof s !== 'string') return undefined
  const u = s.trim()
  if (u === 'Sleep' || u === 'Poison' || u === 'Burn' || u === 'Paralysis') return u
  return undefined
}

function parseDpsRole(s: unknown): MoveDpsRole | undefined {
  if (typeof s !== 'string') return undefined
  const v = s.trim().toLowerCase()
  const ok = ['burst', 'sustain', 'control', 'defense', 'setup', 'disruption', 'recovery'] as const
  return ok.includes(v as (typeof ok)[number]) ? (v as MoveDpsRole) : undefined
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

function clampStatChanges(ch: Record<string, number> | undefined): StatChanges | undefined {
  if (!ch || typeof ch !== 'object') return undefined
  const out: StatChanges = {}
  for (const k of ['attack', 'defense', 'speed', 'accuracy', 'evasion'] as const) {
    if (typeof ch[k] === 'number') out[k] = clamp(ch[k], -2, 2)
  }
  return Object.keys(out).length ? out : undefined
}

export function rid(): string {
  return `fm_${Math.random().toString(36).slice(2, 10)}`
}

function mid(): string {
  return `mv_${Math.random().toString(36).slice(2, 10)}`
}

const ACTIONS = [
  'Strike',
  'Guard',
  'Surge',
  'Pulse',
  'Snare',
  'Rush',
  'Focus',
  'Jam',
  'Burst',
  'Veil',
  'Charge',
  'Detour',
  'Shift',
  'Crash',
  'Bloom',
  'Sting',
  'Roar',
  'Shield',
] as const
const TYPE_WORDS = [
  'Ember',
  'Tidal',
  'Leaf',
  'Volt',
  'Frost',
  'Venom',
  'Terra',
  'Sky',
  'Mind',
  'Stone',
  'Shadow',
  'Scale',
  'Night',
  'Iron',
  'Charm',
] as const

export function generateFallbackMoveName(rand: () => number): string {
  return `${pickSeeded(rand, TYPE_WORDS)} ${pickSeeded(rand, ACTIONS)}`
}

/** Build a legal engine move from AI-like partial data */
export function normalizeFareMonMove(
  raw: Partial<FareMonMove> & { name?: string; type?: string; category?: string },
  fallbackPrimary: FareMonType,
): FareMonMove {
  const moveType = parseFareMonType(raw.type ?? '', fallbackPrimary)
  const category = parseCategory(raw.category)
  let power = typeof raw.power === 'number' ? clamp(raw.power, 0, 90) : 0
  let accuracy = typeof raw.accuracy === 'number' ? clamp(raw.accuracy, 60, 100) : 100
  let priority = typeof raw.priority === 'number' ? clamp(raw.priority, -1, 1) : 0
  const target =
    raw.target === 'self' ? 'self' : 'opponent'

  if (category === 'Damage' && power < 35) power = intRange(() => Math.random(), 35, 70)
  if (category !== 'Damage') power = 0
  if (category === 'Damage' && power === 0) {
    power = intRange(() => Math.random(), 40, 75)
  }

  const statChanges = clampStatChanges(raw.statChanges as Record<string, number> | undefined)
  let statusEffect = parseMajorStatus(raw.statusEffect)
  let statusChance: number | undefined =
    typeof raw.statusChance === 'number' ? clamp(raw.statusChance, 0, 100) : undefined
  if (category === 'Status' && statusEffect) {
    statusChance = statusChance ?? 85
  }

  let healPercent: number | undefined
  if (category === 'Recovery') {
    healPercent = intRange(() => Math.random(), 15, 28)
  }
  let appliesShield: boolean | undefined
  if (category === 'Shield') {
    appliesShield = true
    if (accuracy < 80) accuracy = 100
  }

  let setupDelayedDamage: number | undefined
  if (category === 'Setup') {
    setupDelayedDamage = intRange(() => Math.random(), 12, 35)
  }

  let sleepTurnsMin: number | undefined
  let sleepTurnsMax: number | undefined
  if (statusEffect === 'Sleep') {
    sleepTurnsMin = 1
    sleepTurnsMax = 2
  }

  const description =
    typeof raw.description === 'string' && raw.description.trim()
      ? raw.description.trim()
      : `${category} move aligned with ${moveType}.`

  const m: FareMonMove = {
    id: typeof raw.id === 'string' && raw.id.startsWith('mv_') ? raw.id : mid(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Route Tap',
    type: moveType,
    category,
    power,
    accuracy,
    priority: priority as -1 | 0 | 1,
    target,
    statChanges,
    statusEffect,
    statusChance,
    healPercent,
    appliesShield,
    setupDelayedDamage,
    description,
    iconPrompt: typeof raw.iconPrompt === 'string' ? raw.iconPrompt : undefined,
    duration: typeof raw.duration === 'number' ? clamp(raw.duration, 0, 3) : undefined,
    dpsRole: parseDpsRole(raw.dpsRole),
  }

  if (m.category === 'Damage' && m.power > 0 && !m.dpsRole) {
    m.dpsRole = 'burst'
  }
  if (m.category === 'Recovery' && !m.dpsRole) m.dpsRole = 'recovery'
  return m
}

export function ensureDamageMoveProfile(moves: FareMonMove[]): void {
  /* filled by validate layer */
}

export function normalizeDpsProfile(raw: Partial<DpsProfile> | undefined): DpsProfile {
  const r = (n: unknown) => clamp(typeof n === 'number' ? n : 5, 1, 10)
  return {
    burst: r(raw?.burst),
    sustain: r(raw?.sustain),
    control: r(raw?.control),
    defense: r(raw?.defense),
    speed: r(raw?.speed),
  }
}

export function emptyBattleStages(): Pick<
  FareMon,
  | 'attackStage'
  | 'defenseStage'
  | 'speedStage'
  | 'accuracyStage'
  | 'evasionStage'
  | 'majorStatus'
  | 'sleepTurnsRemaining'
  | 'shieldTurnsRemaining'
  | 'pendingSetupDamage'
> {
  return {
    attackStage: 0,
    defenseStage: 0,
    speedStage: 0,
    accuracyStage: 0,
    evasionStage: 0,
    majorStatus: null,
    sleepTurnsRemaining: 0,
    shieldTurnsRemaining: 0,
    pendingSetupDamage: 0,
  }
}

/** Synthesize a compliant move when validation fails */
export function synthMove(
  rand: () => number,
  variant: 'primary-damage' | 'coverage' | 'utility' | 'status',
  primary: FareMonType,
  coveragePool: FareMonType[],
): FareMonMove {
  const moveType =
    variant === 'primary-damage' || variant === 'status'
      ? primary
      : pickSeeded(rand, coveragePool.filter((t) => t !== primary))

  if (variant === 'primary-damage' || variant === 'coverage') {
    return normalizeFareMonMove(
      {
        name: generateFallbackMoveName(rand),
        type: moveType,
        category: 'Damage',
        power: intRange(rand, 40, 85),
        accuracy: intRange(rand, 75, 100),
        priority: pickSeeded(rand, [-1, 0, 1] as const),
        target: 'opponent',
        description: 'A route-powered strike.',
        dpsRole: 'burst',
      },
      primary,
    )
  }
  if (variant === 'utility') {
    return normalizeFareMonMove(
      {
        name: generateFallbackMoveName(rand),
        type: pickSeeded(rand, ALL_FAREMON_TYPES),
        category: pickSeeded(rand, ['Stat Boost', 'Recovery', 'Shield'] as const),
        power: 0,
        accuracy: 100,
        target: 'self',
        statChanges: { attack: pickSeeded(rand, [-1, 1]) },
        description: 'Adjusts momentum on the fare grid.',
      },
      primary,
    )
  }
  return normalizeFareMonMove(
    {
      name: generateFallbackMoveName(rand),
      type: moveType,
      category: 'Status',
      power: 0,
      accuracy: intRange(rand, 70, 95),
      target: 'opponent',
      statusEffect: pickSeeded(rand, ['Poison', 'Burn', 'Paralysis'] as const),
      statusChance: intRange(rand, 60, 90),
      description: 'Applies a traffic-jam condition.',
    },
    primary,
  )
}

export function buildCoveragePool(primary: FareMonType): FareMonType[] {
  const prefs: Partial<Record<FareMonType, FareMonType[]>> = {
    Dragon: ['Fire', 'Flying', 'Dark', 'Steel', 'Ground', 'Grass', 'Electric', 'Normal'],
    Water: ['Ice', 'Ground', 'Psychic', 'Steel', 'Normal'],
    Fire: ['Flying', 'Dark', 'Ground', 'Dragon', 'Normal'],
    Grass: ['Poison', 'Fairy', 'Ground', 'Bug', 'Normal'],
    Electric: ['Steel', 'Flying', 'Normal', 'Psychic'],
  }
  const extra = prefs[primary] ?? ALL_FAREMON_TYPES.filter((t) => t !== primary)
  return Array.from(new Set([...extra, ...ALL_FAREMON_TYPES]))
}
