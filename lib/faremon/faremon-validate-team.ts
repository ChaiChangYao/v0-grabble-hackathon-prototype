import type { FareMon, FareMonMove, FareMonType } from './types'
import type { z } from 'zod'
import { generateFareMonTeamResponseSchema } from './faremon-ai-zod'
import {
  buildCoveragePool,
  emptyBattleStages,
  generateFallbackMoveName,
  normalizeDpsProfile,
  normalizeFareMonMove,
  parseFareMonType,
  rid,
  synthMove,
} from './faremon-normalize'
import { createSeededRandom, hashSeedString, intRange } from './seeded-random'

type RawTeam = z.infer<typeof generateFareMonTeamResponseSchema>

function damageCount(moves: FareMonMove[]): number {
  return moves.filter((m) => m.category === 'Damage' && m.power > 0).length
}

function hasPrimaryMove(moves: FareMonMove[], primary: FareMonType): boolean {
  return moves.some((m) => m.type === primary)
}

function hasNonDamage(moves: FareMonMove[]): boolean {
  return moves.some((m) => m.category !== 'Damage' || m.power === 0)
}

function fixMoves(
  moves: FareMonMove[],
  primary: FareMonType,
  rand: () => number,
  coveragePool: FareMonType[],
): FareMonMove[] {
  let mvs = moves.map((m) => ({ ...m }))
  if (mvs.length < 4) {
    while (mvs.length < 4) {
      mvs.push(synthMove(rand, 'coverage', primary, coveragePool))
    }
  }
  if (mvs.length > 4) mvs = mvs.slice(0, 4)

  let tries = 0
  while (tries++ < 20) {
    let dmg = damageCount(mvs)
    if (dmg === 0) {
      const slot = intRange(rand, 0, 3)
      mvs[slot] = synthMove(rand, 'primary-damage', primary, coveragePool)
    }
    dmg = damageCount(mvs)
    if (dmg > 3) {
      const idx = mvs.findIndex((x) => x.category === 'Damage' && x.power > 0)
      if (idx >= 0) mvs[idx] = synthMove(rand, 'utility', primary, coveragePool)
    }
    if (!hasNonDamage(mvs)) {
      const idx = intRange(rand, 0, 3)
      mvs[idx] = synthMove(rand, 'utility', primary, coveragePool)
    }
    if (!hasPrimaryMove(mvs, primary)) {
      const idx = intRange(rand, 0, 3)
      mvs[idx] = normalizeFareMonMove(
        {
          name: generateFallbackMoveName(rand),
          type: primary,
          category: 'Damage',
          power: intRange(rand, 50, 80),
          accuracy: intRange(rand, 80, 100),
          target: 'opponent',
          description: 'Lane strike using core typing.',
        },
        primary,
      )
    }
    dmg = damageCount(mvs)
    const ok =
      dmg >= 1 &&
      dmg <= 3 &&
      hasNonDamage(mvs) &&
      hasPrimaryMove(mvs, primary)
    if (ok) break
  }

  return mvs.slice(0, 4)
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (let n of names) {
    const base = n.trim() || 'Route Mon'
    let final = base
    let i = 1
    while (seen.has(final.toLowerCase())) {
      final = `${base} ${i++}`
    }
    seen.add(final.toLowerCase())
    out.push(final)
  }
  return out
}

export interface ValidatedTeamResult {
  faremons: [FareMon, FareMon]
}

function clampNum(v: unknown, lo: number, hi: number, fallback: number): number {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback
  return Math.max(lo, Math.min(hi, Math.round(v)))
}

export function validateGeneratedFareMonTeam(
  raw: unknown,
  selectedTypes: [FareMonType, FareMonType],
  seedHint: string,
): ValidatedTeamResult | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as RawTeam
  if (!Array.isArray(o.faremons) || o.faremons.length !== 2) return null

  const rand = createSeededRandom(hashSeedString(seedHint))
  const coverage1 = buildCoveragePool(selectedTypes[0])
  const coverage2 = buildCoveragePool(selectedTypes[1])

  const out: FareMon[] = []
  const rawNames: string[] = []

  for (let i = 0; i < 2; i++) {
    const sel = selectedTypes[i]
    const rf = o.faremons[i]
    if (!rf || typeof rf !== 'object') return null

    const primary = parseFareMonType((rf as { primaryType?: string }).primaryType, sel)
    if (primary !== sel) {
      ;(rf as { primaryType: string }).primaryType = sel
    }

    let secondary: FareMonType | null = null
    const secondaryRaw = (rf as { secondaryType?: string | null }).secondaryType
    if (secondaryRaw) {
      const st = parseFareMonType(secondaryRaw, primary)
      secondary = st === primary ? null : st
    }

    rawNames.push(typeof rf.name === 'string' ? rf.name : 'Unnamed')

    const movesRaw = Array.isArray((rf as { moves?: unknown }).moves)
      ? ((rf as { moves: unknown[] }).moves as Parameters<typeof normalizeFareMonMove>[0][])
      : []

    let moves = movesRaw.map((m) => normalizeFareMonMove(m ?? {}, primary))
    moves = fixMoves(moves, primary, rand, i === 0 ? coverage1 : coverage2)

    const stats = {
      maxHP: clampNum((rf as { maxHP?: number }).maxHP, 85, 120, intRange(rand, 90, 110)),
      attack: clampNum((rf as { attack?: number }).attack, 45, 75, intRange(rand, 52, 68)),
      defense: clampNum((rf as { defense?: number }).defense, 35, 65, intRange(rand, 40, 58)),
      speed: clampNum((rf as { speed?: number }).speed, 30, 90, intRange(rand, 45, 75)),
    }

    const vi =
      typeof (rf as { visualIdentity?: string }).visualIdentity === 'string' &&
      (rf as { visualIdentity: string }).visualIdentity.trim()
        ? (rf as { visualIdentity: string }).visualIdentity.trim()
        : `Mobility-themed ${primary}${secondary ? `/${secondary}` : ''} creature with expressway motifs; compact readable silhouette; limited palette.`

    const cf =
      typeof (rf as { characterPromptFront?: string }).characterPromptFront === 'string'
        ? (rf as { characterPromptFront: string }).characterPromptFront
        : ''
    const cb =
      typeof (rf as { characterPromptBack?: string }).characterPromptBack === 'string'
        ? (rf as { characterPromptBack: string }).characterPromptBack
        : ''

    const fm: FareMon = {
      id:
        typeof (rf as { id?: string }).id === 'string' && (rf as { id: string }).id.startsWith('fm_')
          ? (rf as { id: string }).id
          : rid(),
      name: '',
      primaryType: primary,
      secondaryType: secondary,
      maxHP: stats.maxHP,
      currentHP: stats.maxHP,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      accuracy: 100,
      evasion: 100,
      farePressure: clampNum((rf as { farePressure?: number }).farePressure, 50, 50, 50),
      playstyle:
        typeof (rf as { playstyle?: string }).playstyle === 'string'
          ? (rf as { playstyle: string }).playstyle
          : undefined,
      dpsProfile: normalizeDpsProfile(
        (rf as { dpsProfile?: Partial<NonNullable<FareMon['dpsProfile']>> }).dpsProfile,
      ),
      visualIdentity: vi,
      characterPromptFront: cf || undefined,
      characterPromptBack: cb || undefined,
      imagePrompt: `Original ride-hailing elemental creature, ${vi}`,
      moves,
      ...emptyBattleStages(),
    }
    out.push(fm)
  }

  const names = uniqueNames(rawNames)
  out[0]!.name = names[0]!
  out[1]!.name = names[1]!

  return { faremons: [out[0]!, out[1]!] }
}
