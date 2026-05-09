import type { FareMonMove, FareMonType, MoveCategory } from './types'
import { generateFareMonMoves } from './moves-templates'

const MAJOR = new Set(['Sleep', 'Poison', 'Burn', 'Paralysis'])
const CATEGORIES: Set<MoveCategory> = new Set([
  'Damage',
  'Stat Boost',
  'Stat Debuff',
  'Status',
  'Shield',
  'Recovery',
  'Setup',
  'Disruption',
])

const TYPES = new Set<FareMonType>([
  'Normal',
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
])

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function clampStageDelta(n: number): number {
  if (Number.isNaN(n)) return 0
  return clamp(Math.trunc(n), -2, 2)
}

/** Normalize & repair a list of moves from AI or untrusted JSON */
export function validateAndRepairMoves(moves: Partial<FareMonMove>[], primaryType: FareMonType): FareMonMove[] {
  const out: FareMonMove[] = []
  const fallback = generateFareMonMoves(primaryType)

  for (let i = 0; i < 4; i++) {
    const raw = moves[i]
    const base = fallback[i]
    if (!raw || typeof raw !== 'object') {
      out.push(base)
      continue
    }

    let category = raw.category as MoveCategory
    if (!category || !CATEGORIES.has(category)) category = 'Damage'

    let type = raw.type as FareMonType
    if (!type || !TYPES.has(type)) type = primaryType

    const name =
      typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim().slice(0, 32) : base.name

    let power = clamp(Number(raw.power) || 0, 0, 120)
    let accuracy = clamp(Number(raw.accuracy) || 100, 30, 100)
    const priority = clamp(Number(raw.priority) || 0, -2, 2)
    const target = raw.target === 'self' ? 'self' : 'opponent'

    if (category === 'Damage' && power < 1) power = 40
    if (category !== 'Damage' && category !== 'Disruption') power = 0

    let statusEffect = raw.statusEffect as FareMonMove['statusEffect']
    if (statusEffect && !MAJOR.has(statusEffect)) statusEffect = undefined

    let statChanges = raw.statChanges
    if (statChanges && typeof statChanges === 'object') {
      statChanges = {
        attack: statChanges.attack !== undefined ? clampStageDelta(statChanges.attack) : undefined,
        defense: statChanges.defense !== undefined ? clampStageDelta(statChanges.defense) : undefined,
        speed: statChanges.speed !== undefined ? clampStageDelta(statChanges.speed) : undefined,
        accuracy: statChanges.accuracy !== undefined ? clampStageDelta(statChanges.accuracy) : undefined,
        evasion: statChanges.evasion !== undefined ? clampStageDelta(statChanges.evasion) : undefined,
      }
    }

    const statusChance =
      raw.statusChance !== undefined ? clamp(Number(raw.statusChance), 0, 100) : undefined

    const healPercent =
      raw.healPercent !== undefined ? clamp(Number(raw.healPercent), 5, 50) : undefined

    const move: FareMonMove = {
      id: typeof raw.id === 'string' ? raw.id : base.id,
      name,
      type,
      category,
      power,
      accuracy,
      priority,
      target,
      statChanges: statChanges as FareMonMove['statChanges'],
      statusEffect,
      statusChance,
      healPercent,
      appliesShield: Boolean(raw.appliesShield),
      setupDelayedDamage:
        raw.setupDelayedDamage !== undefined
          ? clamp(Number(raw.setupDelayedDamage), 0, 100)
          : undefined,
      bonusIfPoisoned:
        raw.bonusIfPoisoned !== undefined ? clamp(Number(raw.bonusIfPoisoned), 0, 80) : undefined,
      sleepTurnsMin: raw.sleepTurnsMin !== undefined ? clamp(Math.trunc(Number(raw.sleepTurnsMin)), 1, 3) : undefined,
      sleepTurnsMax: raw.sleepTurnsMax !== undefined ? clamp(Math.trunc(Number(raw.sleepTurnsMax)), 1, 3) : undefined,
      description:
        typeof raw.description === 'string' ? raw.description.slice(0, 240) : base.description,
      iconPrompt: typeof raw.iconPrompt === 'string' ? raw.iconPrompt : undefined,
    }

    if (move.category === 'Damage' && move.power > 85 && (move.statusChance ?? 0) > 40) {
      move.statusChance = 20
    }

    out.push(move)
  }

  const dmg = out.filter((m) => m.category === 'Damage').length
  const nonDmg = out.filter((m) => m.category !== 'Damage').length

  if (dmg === 4) {
    const idx = 3
    const swap = fallback.find((m) => m.category !== 'Damage') ?? generateFareMonMoves(primaryType)[1]
    out[idx] = { ...swap, id: out[idx].id }
  }
  if (nonDmg === 4) {
    out[0] = { ...fallback[0], id: out[0].id }
  }

  return out.slice(0, 4)
}
