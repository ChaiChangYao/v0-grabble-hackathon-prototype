import type { FareMon, FareMonType } from './types'
import { ALL_FAREMON_TYPES } from './type-chart'
import { RouteContextInput } from './faremon-ai-prompts'
import {
  buildCoveragePool,
  emptyBattleStages,
  generateFallbackMoveName,
  normalizeDpsProfile,
  normalizeFareMonMove,
  parseFareMonType,
  rid,
} from './faremon-normalize'
import { createSeededRandom, hashSeedString, intRange, pickSeeded } from './seeded-random'

const PREFIXES = [
  'Surge',
  'Metro',
  'Rain',
  'Peak',
  'Night',
  'Signal',
  'Route',
  'Turbo',
  'Drift',
  'Neon',
  'Echo',
  'Sky',
  'Rift',
  'Ember',
  'Hydro',
  'Volt',
  'Iron',
  'Mystic',
  'Venom',
  'Lunar',
] as const

const SUFFIXES = [
  'Drake',
  'Manta',
  'Lynx',
  'Wyrm',
  'Cabbit',
  'Serpent',
  'Sprite',
  'Golem',
  'Falcon',
  'Otter',
  'Beetle',
  'Phantom',
  'Titan',
  'Fox',
  'Runner',
  'Shell',
  'Bloom',
  'Fang',
] as const

const PLAYSTYLES = [
  'fast disruption',
  'heavy burst attacker',
  'route-control tank',
  'lane tempo specialist',
  'sustain skirmisher',
  'expressway breaker',
]

function randomName(rand: () => number): string {
  return `${pickSeeded(rand, PREFIXES)} ${pickSeeded(rand, SUFFIXES)}`
}

function synthMoves(primary: FareMonType, rand: () => number, pool: FareMonType[]): FareMon['moves'] {
  const primaryDmg = normalizeFareMonMove(
    {
      name: generateFallbackMoveName(rand),
      type: primary,
      category: 'Damage',
      power: intRange(rand, 55, 85),
      accuracy: intRange(rand, 82, 100),
      priority: pickSeeded(rand, [-1, 0, 1] as const),
      target: 'opponent',
      description: 'Primary lane strike.',
      dpsRole: 'burst',
    },
    primary,
  )
  const cov = normalizeFareMonMove(
    {
      name: generateFallbackMoveName(rand),
      type: pickSeeded(rand, pool.filter((t) => t !== primary)),
      category: 'Damage',
      power: intRange(rand, 38, 72),
      accuracy: intRange(rand, 75, 95),
      target: 'opponent',
      description: 'Coverage hit from an allied type.',
      dpsRole: 'sustain',
    },
    primary,
  )
  const uc = pickSeeded(rand, ['Stat Boost', 'Recovery', 'Shield'] as const)
  const utilBase: Parameters<typeof normalizeFareMonMove>[0] = {
    name: generateFallbackMoveName(rand),
    type: primary,
    category: uc,
    power: 0,
    accuracy: 100,
    target: 'self',
    description: 'Utility move.',
    dpsRole: 'recovery',
  }
  if (uc === 'Stat Boost') utilBase.statChanges = { attack: pickSeeded(rand, [-1, 1]) }
  if (uc === 'Recovery') {
    utilBase.healPercent = intRange(rand, 18, 26)
  }
  if (uc === 'Shield') {
    utilBase.appliesShield = true
  }
  const util = normalizeFareMonMove(utilBase, primary)
  const status = normalizeFareMonMove(
    {
      name: generateFallbackMoveName(rand),
      type: pickSeeded(rand, pool),
      category: 'Status',
      power: 0,
      accuracy: intRange(rand, 75, 95),
      target: 'opponent',
      statusEffect: pickSeeded(rand, ['Poison', 'Burn', 'Paralysis'] as const),
      statusChance: intRange(rand, 65, 90),
      description: 'Ties up traffic.',
      dpsRole: 'control',
    },
    primary,
  )
  return [primaryDmg, cov, util, status]
}

function oneFareMon(
  primary: FareMonType,
  rand: () => number,
  rc: RouteContextInput,
): FareMon {
  const pool = buildCoveragePool(primary)
  const secRoll = rand()
  const secondary =
    secRoll < 0.35
      ? null
      : (() => {
          const candidates = ALL_FAREMON_TYPES.filter((t) => t !== primary)
          return pickSeeded(rand, candidates)
        })()

  const playstyle = pickSeeded(rand, PLAYSTYLES)
  let atk = intRange(rand, 48, 72)
  let def = intRange(rand, 38, 62)
  let spd = intRange(rand, 35, 88)
  let hp = intRange(rand, 86, 118)

  if (playstyle.includes('burst')) {
    atk += intRange(rand, 4, 10)
    spd += intRange(rand, 0, 8)
    def -= intRange(rand, 0, 8)
  } else if (playstyle.includes('tank')) {
    def += intRange(rand, 4, 12)
    hp += intRange(rand, 4, 10)
    spd -= intRange(rand, 0, 12)
  } else if (playstyle.includes('fast')) {
    spd += intRange(rand, 8, 18)
    hp -= intRange(rand, 0, 10)
  }

  atk = Math.max(45, Math.min(75, atk))
  def = Math.max(35, Math.min(65, def))
  spd = Math.max(30, Math.min(90, spd))
  hp = Math.max(85, Math.min(120, hp))

  const vi = `${rc.city} ${rc.weather} route-themed ${primary}${secondary ? `/${secondary}` : ''} mobility creature; ${playstyle}; compact silhouette; palette echoing neon lane markings and fare-meter glow.`

  const moves = synthMoves(primary, rand, pool)

  return {
    id: rid(),
    name: randomName(rand),
    primaryType: primary,
    secondaryType: secondary === primary ? null : secondary,
    maxHP: hp,
    currentHP: hp,
    attack: atk,
    defense: def,
    speed: spd,
    accuracy: 100,
    evasion: 100,
    farePressure: 50,
    playstyle,
    dpsProfile: normalizeDpsProfile({
      burst: playstyle.includes('burst') ? 8 : intRange(rand, 4, 7),
      sustain: intRange(rand, 4, 8),
      control: playstyle.includes('control') ? 8 : intRange(rand, 3, 7),
      defense: playstyle.includes('tank') ? 8 : intRange(rand, 3, 7),
      speed: playstyle.includes('fast') ? 9 : intRange(rand, 4, 8),
    }),
    visualIdentity: vi,
    characterPromptFront: undefined,
    characterPromptBack: undefined,
    imagePrompt: `Original ride-hailing elemental creature, ${vi}`,
    moves,
    ...emptyBattleStages(),
  }
}

export function createRandomFareMonTeam(args: {
  selectedTypes: [FareMonType, FareMonType]
  routeContext: RouteContextInput
  playerId: string
  matchSeed: string
}): [FareMon, FareMon] {
  const base = `${args.matchSeed}|${args.playerId}|${args.selectedTypes.join(',')}|${args.routeContext.pickup}`
  const rand = createSeededRandom(hashSeedString(`${base}|fallback`))
  const a = oneFareMon(args.selectedTypes[0], rand, args.routeContext)
  const b = oneFareMon(args.selectedTypes[1], rand, args.routeContext)
  if (a.name.toLowerCase() === b.name.toLowerCase()) {
    b.name = `${b.name} II`
  }
  return [a, b]
}
