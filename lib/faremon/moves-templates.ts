import type { FareMonMove, FareMonType } from './types'

export type MoveTemplate = Omit<FareMonMove, 'id'>

function mv(
  partial: Partial<FareMonMove> &
    Pick<FareMonMove, 'name' | 'type' | 'category' | 'description'>,
): MoveTemplate {
  return {
    priority: 0,
    target: 'opponent',
    power: 0,
    accuracy: 100,
    ...partial,
  } as MoveTemplate
}

const NORMAL: MoveTemplate[] = [
  mv({
    name: 'Quick Lane',
    type: 'Normal',
    category: 'Damage',
    power: 40,
    accuracy: 100,
    priority: 1,
    description: 'A fast low-power strike that often acts first.',
  }),
  mv({
    name: 'Focus Meter',
    type: 'Normal',
    category: 'Stat Boost',
    power: 0,
    accuracy: 100,
    target: 'self',
    statChanges: { attack: 1 },
    description: 'Sharpen focus to raise Attack.',
  }),
  mv({
    name: 'Calm Route',
    type: 'Normal',
    category: 'Recovery',
    power: 0,
    accuracy: 100,
    target: 'self',
    healPercent: 20,
    description: 'Steady breathing restores a slice of HP.',
  }),
]

const BY_TYPE: Record<FareMonType, MoveTemplate[]> = {
  Normal: NORMAL,
  Fire: [
    mv({
      name: 'Flame Surge',
      type: 'Fire',
      category: 'Damage',
      power: 60,
      accuracy: 90,
      statusChance: 25,
      statusEffect: 'Burn',
      description: 'Burst flame that may leave a lasting burn.',
    }),
    mv({
      name: 'Overheat Fare',
      type: 'Fire',
      category: 'Damage',
      power: 95,
      accuracy: 65,
      selfStatChanges: { attack: -1 },
      description: 'Huge heat burst; strains your own attacking rhythm.',
    }),
    mv({
      name: 'Burning Meter',
      type: 'Fire',
      category: 'Status',
      power: 0,
      accuracy: 85,
      statusEffect: 'Burn',
      description: 'Applies a fierce burn with fare-meter flare.',
    }),
    mv({
      name: 'Ember Detour',
      type: 'Fire',
      category: 'Damage',
      power: 45,
      accuracy: 95,
      description: 'Reliable fire chip damage.',
    }),
  ],
  Water: [
    mv({
      name: 'Rain Guard',
      type: 'Water',
      category: 'Shield',
      power: 0,
      accuracy: 100,
      target: 'self',
      appliesShield: true,
      description: 'Summons a water barrier that softens the next hit.',
    }),
    mv({
      name: 'Hydro Lane',
      type: 'Water',
      category: 'Damage',
      power: 65,
      accuracy: 90,
      description: 'A strong wave down the express lane.',
    }),
    mv({
      name: 'Flow Reset',
      type: 'Water',
      category: 'Recovery',
      power: 0,
      accuracy: 100,
      target: 'self',
      healPercent: 25,
      description: 'Cool flow restores vitality.',
    }),
    mv({
      name: 'Surge Pool',
      type: 'Water',
      category: 'Stat Debuff',
      power: 0,
      accuracy: 90,
      statChanges: { speed: -1 },
      description: 'Slows the opponent with clinging tide.',
    }),
  ],
  Grass: [
    mv({
      name: 'Growth Route',
      type: 'Grass',
      category: 'Stat Boost',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { attack: 1, defense: 1 },
      description: 'Plants surge upward, boosting offense and defense.',
    }),
    mv({
      name: 'Vine Detour',
      type: 'Grass',
      category: 'Damage',
      power: 55,
      accuracy: 90,
      statChanges: { speed: -1 },
      description: 'Vines strike and tangle the opponent legs.',
    }),
    mv({
      name: 'Drowse Spores',
      type: 'Grass',
      category: 'Status',
      power: 0,
      accuracy: 70,
      statusEffect: 'Sleep',
      sleepTurnsMin: 1,
      sleepTurnsMax: 2,
      description: 'Sleep-inducing spores; inaccurate but disruptive.',
    }),
    mv({
      name: 'Canopy Needle',
      type: 'Grass',
      category: 'Damage',
      power: 48,
      accuracy: 95,
      description: 'Sharp leaves from the canopy.',
    }),
  ],
  Electric: [
    mv({
      name: 'Volt Dispatch',
      type: 'Electric',
      category: 'Damage',
      power: 62,
      accuracy: 92,
      statusChance: 20,
      statusEffect: 'Paralysis',
      description: 'Quick volts that may paralyze.',
    }),
    mv({
      name: 'Signal Boost',
      type: 'Electric',
      category: 'Stat Boost',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { speed: 2 },
      description: 'Amplifies movement speed sharply.',
    }),
    mv({
      name: 'Static Jam',
      type: 'Electric',
      category: 'Status',
      power: 0,
      accuracy: 75,
      statusEffect: 'Paralysis',
      description: 'Jams the foe with loud static.',
    }),
    mv({
      name: 'Arc Step',
      type: 'Electric',
      category: 'Damage',
      power: 42,
      accuracy: 100,
      priority: 1,
      description: 'Lightning-fast poke.',
    }),
  ],
  Ice: [
    mv({
      name: 'Frost Surge',
      type: 'Ice',
      category: 'Damage',
      power: 68,
      accuracy: 88,
      description: 'Icy burst with frostbite sting.',
    }),
    mv({
      name: 'Rime Guard',
      type: 'Ice',
      category: 'Shield',
      power: 0,
      accuracy: 100,
      target: 'self',
      appliesShield: true,
      description: 'Ice plating deflects part of the next blow.',
    }),
    mv({
      name: 'Chill Snare',
      type: 'Ice',
      category: 'Stat Debuff',
      power: 0,
      accuracy: 95,
      statChanges: { speed: -1 },
      description: 'Cold that makes the foe sluggish.',
    }),
  ],
  Fighting: [
    mv({
      name: 'Power Stance',
      type: 'Fighting',
      category: 'Stat Boost',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { attack: 2 },
      description: 'Tense muscles for a heavy offense.',
    }),
    mv({
      name: 'Counter Rush',
      type: 'Fighting',
      category: 'Damage',
      power: 72,
      accuracy: 85,
      description: 'Straight rush counterattack.',
    }),
    mv({
      name: 'Guard Break',
      type: 'Fighting',
      category: 'Damage',
      power: 58,
      accuracy: 90,
      statChanges: { defense: -1 },
      description: 'Cracks the opponents guard.',
    }),
  ],
  Poison: [
    mv({
      name: 'Venom Coating',
      type: 'Poison',
      category: 'Status',
      power: 0,
      accuracy: 90,
      statusEffect: 'Poison',
      description: 'Coats the foe in lingering venom.',
    }),
    mv({
      name: 'Venom Route',
      type: 'Poison',
      category: 'Damage',
      power: 50,
      accuracy: 100,
      bonusIfPoisoned: 35,
      description: 'Extra damage if the target is already poisoned.',
    }),
    mv({
      name: 'Corrode Meter',
      type: 'Poison',
      category: 'Stat Debuff',
      power: 0,
      accuracy: 100,
      statChanges: { defense: -1 },
      description: 'Acid eats away armor.',
    }),
    mv({
      name: 'Fume Jab',
      type: 'Poison',
      category: 'Damage',
      power: 44,
      accuracy: 95,
      description: 'A toxic jab with fumes.',
    }),
  ],
  Ground: [
    mv({
      name: 'Tremor Fare',
      type: 'Ground',
      category: 'Damage',
      power: 70,
      accuracy: 85,
      description: 'Shakes the lane beneath the opponent.',
    }),
    mv({
      name: 'Dust Screen',
      type: 'Ground',
      category: 'Stat Boost',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { evasion: 1 },
      description: 'Kicks up dust to blur incoming strikes.',
    }),
    mv({
      name: 'Fault Line',
      type: 'Ground',
      category: 'Stat Debuff',
      power: 0,
      accuracy: 90,
      statChanges: { accuracy: -1 },
      description: 'Unstable ground ruins aim.',
    }),
  ],
  Flying: [
    mv({
      name: 'Gust Rush',
      type: 'Flying',
      category: 'Damage',
      power: 56,
      accuracy: 95,
      priority: 1,
      description: 'A sudden gust strike.',
    }),
    mv({
      name: 'Tailwind Route',
      type: 'Flying',
      category: 'Stat Boost',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { speed: 1, evasion: 1 },
      description: 'Favorable wind boosts speed and evasion.',
    }),
    mv({
      name: 'Feather Snare',
      type: 'Flying',
      category: 'Disruption',
      power: 30,
      accuracy: 95,
      statChanges: { attack: -1 },
      description: 'Disruptive feathers weaken the next blows.',
    }),
  ],
  Psychic: [
    mv({
      name: 'Mind Route',
      type: 'Psychic',
      category: 'Stat Debuff',
      power: 0,
      accuracy: 95,
      statChanges: { accuracy: -1 },
      description: 'Psychic noise clouds judgment.',
    }),
    mv({
      name: 'Future Fare',
      type: 'Psychic',
      category: 'Setup',
      power: 0,
      accuracy: 100,
      setupDelayedDamage: 55,
      description: 'Delays a psychic pulse to strike next turn.',
    }),
    mv({
      name: 'Focus Read',
      type: 'Psychic',
      category: 'Stat Boost',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { accuracy: 1, evasion: 1 },
      description: 'Reads the flow of battle.',
    }),
    mv({
      name: 'Pulse Lane',
      type: 'Psychic',
      category: 'Damage',
      power: 60,
      accuracy: 90,
      description: 'Mind-force down the lane.',
    }),
  ],
  Bug: [
    mv({
      name: 'Thread Snare',
      type: 'Bug',
      category: 'Damage',
      power: 52,
      accuracy: 92,
      statChanges: { speed: -1 },
      description: 'Sticky threads snag the foe.',
    }),
    mv({
      name: 'Nest Guard',
      type: 'Bug',
      category: 'Shield',
      power: 0,
      accuracy: 100,
      target: 'self',
      appliesShield: true,
      description: 'A cocoon barrier softens one hit.',
    }),
    mv({
      name: 'Rapid Buzz',
      type: 'Bug',
      category: 'Damage',
      power: 38,
      accuracy: 100,
      priority: 1,
      description: 'Fast irritating buzz attack.',
    }),
  ],
  Rock: [
    mv({
      name: 'Boulder Push',
      type: 'Rock',
      category: 'Damage',
      power: 74,
      accuracy: 82,
      description: 'A heavy rolling stone.',
    }),
    mv({
      name: 'Crystal Shell',
      type: 'Rock',
      category: 'Stat Boost',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { defense: 2 },
      description: 'Armors up with crystal layers.',
    }),
    mv({
      name: 'Gravel Spray',
      type: 'Rock',
      category: 'Damage',
      power: 46,
      accuracy: 95,
      description: 'Sprays sharp gravel.',
    }),
  ],
  Ghost: [
    mv({
      name: 'Phase Slip',
      type: 'Ghost',
      category: 'Damage',
      power: 64,
      accuracy: 88,
      description: 'Phases through shields of complacency.',
    }),
    mv({
      name: 'Spook Meter',
      type: 'Ghost',
      category: 'Stat Debuff',
      power: 0,
      accuracy: 90,
      statChanges: { accuracy: -2 },
      description: 'Haunting fare-meter flicker ruins aim.',
    }),
    mv({
      name: 'Wisp Veil',
      type: 'Ghost',
      category: 'Disruption',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { evasion: 2 },
      description: 'Shifts between lanes unpredictably.',
    }),
  ],
  Dragon: [
    mv({
      name: 'Dragon Surge',
      type: 'Dragon',
      category: 'Damage',
      power: 92,
      accuracy: 82,
      description: 'Raw draconic pressure.',
    }),
    mv({
      name: 'Scale Up',
      type: 'Dragon',
      category: 'Stat Boost',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { attack: 1, speed: 1 },
      description: 'Armored scales flare with speed.',
    }),
    mv({
      name: 'Risk Roar',
      type: 'Dragon',
      category: 'Damage',
      power: 105,
      accuracy: 62,
      description: 'Wild roar; powerful but hard to land.',
    }),
  ],
  Dark: [
    mv({
      name: 'Night Detour',
      type: 'Dark',
      category: 'Damage',
      power: 58,
      accuracy: 92,
      statChanges: { accuracy: -1 },
      description: 'A dirty trick under streetlights.',
    }),
    mv({
      name: 'Fare Trick',
      type: 'Dark',
      category: 'Stat Debuff',
      power: 0,
      accuracy: 95,
      statChanges: { attack: -1 },
      description: 'Mind games sap the opponents power.',
    }),
    mv({
      name: 'Ambush Route',
      type: 'Dark',
      category: 'Damage',
      power: 55,
      accuracy: 100,
      priority: 1,
      description: 'Momentum when acting before the foe.',
    }),
  ],
  Steel: [
    mv({
      name: 'Meter Armor',
      type: 'Steel',
      category: 'Shield',
      power: 0,
      accuracy: 100,
      target: 'self',
      appliesShield: true,
      description: 'Steel fare-meter plating.',
    }),
    mv({
      name: 'Iron Route',
      type: 'Steel',
      category: 'Damage',
      power: 66,
      accuracy: 90,
      description: 'Rigid iron-line strike.',
    }),
    mv({
      name: 'Fortify Cab',
      type: 'Steel',
      category: 'Stat Boost',
      power: 0,
      accuracy: 100,
      target: 'self',
      statChanges: { defense: 2 },
      description: 'Reinforces the cabin shell.',
    }),
  ],
  Fairy: [
    mv({
      name: 'Charm Fare',
      type: 'Fairy',
      category: 'Stat Debuff',
      power: 0,
      accuracy: 90,
      statChanges: { attack: -2 },
      description: 'Sweet routing undercuts aggression.',
    }),
    mv({
      name: 'Glow Route',
      type: 'Fairy',
      category: 'Recovery',
      power: 0,
      accuracy: 100,
      target: 'self',
      healPercent: 22,
      description: 'Soft light restores HP.',
    }),
    mv({
      name: 'Mystic Lane',
      type: 'Fairy',
      category: 'Damage',
      power: 61,
      accuracy: 93,
      description: 'Sparkling mystical force.',
    }),
  ],
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function isDamage(m: MoveTemplate): boolean {
  return m.category === 'Damage'
}

function isStab(m: MoveTemplate, primary: FareMonType, secondary?: FareMonType | null): boolean {
  return m.type === primary || m.type === secondary
}

export function generateFareMonMoves(primary: FareMonType, secondary?: FareMonType | null): FareMonMove[] {
  const pool: MoveTemplate[] = [...BY_TYPE[primary], ...NORMAL]
  if (secondary) pool.push(...BY_TYPE[secondary])
  const uniqueByName = new Map<string, MoveTemplate>()
  for (const t of pool) {
    if (!uniqueByName.has(t.name)) uniqueByName.set(t.name, t)
  }
  const uniq = [...uniqueByName.values()].sort(() => Math.random() - 0.5)

  const chosen: MoveTemplate[] = []
  const tryAdd = (t: MoveTemplate) => {
    if (chosen.some((c) => c.name === t.name)) return false
    const dmgCount = chosen.filter(isDamage).length
    if (isDamage(t) && dmgCount >= 3) return false
    chosen.push(t)
    return true
  }

  for (const t of uniq.filter((m) => isStab(m, primary, secondary))) {
    if (chosen.length >= 4) break
    tryAdd(t)
  }
  for (const t of uniq) {
    if (chosen.length >= 4) break
    tryAdd(t)
  }
  if (!chosen.some(isDamage)) {
    const d = uniq.find(isDamage)
    if (d) {
      if (chosen.length >= 4) chosen.pop()
      if (!chosen.some((c) => c.name === d.name)) chosen.push(d)
    }
  }
  if (!chosen.some((m) => m.category !== 'Damage')) {
    const s = uniq.find((t) => t.category !== 'Damage')
    if (s) {
      const dropIdx = chosen.findIndex((c) => c.category === 'Damage')
      if (dropIdx >= 0) chosen.splice(dropIdx, 1)
      if (!chosen.some((c) => c.name === s.name)) chosen.push(s)
    }
  }
  while (chosen.length < 4) {
    const n = NORMAL[chosen.length % NORMAL.length]
    if (!chosen.some((c) => c.name === n.name)) chosen.push({ ...n })
    else break
  }
  return chosen.slice(0, 4).map((t) => ({ ...t, id: generateId() }))
}
