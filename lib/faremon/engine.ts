import { ALL_FAREMON_TYPES, getEffectivenessLabel, totalTypeMultiplier } from './type-chart'
import { generateFareMonMoves } from './moves-templates'
import { applyStageDelta, getStageMultiplier } from './stat-utils'
import type {
  FareMon,
  FareMonBattleState,
  FareMonMove,
  FareMonTeam,
  FareMonType,
  MajorStatus,
  PlayerActionKind,
  StatChanges,
} from './types'

export type {
  FareMon,
  FareMonBattleState,
  FareMonMove,
  FareMonTeam,
  FareMonType,
  MajorStatus,
  MoveCategory,
  StatChanges,
} from './types'

export { ALL_FAREMON_TYPES } from './type-chart'
export { TYPE_EFFECTIVENESS } from './type-chart'

const fireNames = ['Surge Ember', 'Meter Drake', 'Heatlane Fox', 'Flare Cabbit', 'Peak Pyro', 'Ignite Rider', 'Blaze Shuttle', 'Thermal Dash']
const grassNames = ['Route Sprout', 'Garden Glide', 'Leafline Lynx', 'Greenway Manta', 'Canopy Cabbit', 'Verdant Cruiser', 'Foliage Flyer', 'Moss Meter']
const waterNames = ['Rainstream Otter', 'Hydro Taxi', 'Monsoon Manta', 'Riverlane Serpent', 'Drizzle Dash', 'Tide Runner', 'Aqua Express', 'Current Courier']
const genericNames = [
  'Lane Lynx',
  'Cab Courier',
  'Surge Sprite',
  'Meter Moth',
  'Express Echo',
  'Route Wisp',
  'Peak Phantom',
  'Grid Gremlin',
]

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function emptyStagesFareMon(): Pick<
  FareMon,
  'attackStage' | 'defenseStage' | 'speedStage' | 'accuracyStage' | 'evasionStage' | 'majorStatus' | 'sleepTurnsRemaining' | 'shieldTurnsRemaining' | 'pendingSetupDamage'
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

export function generateFareMonStats() {
  return {
    maxHP: randomInRange(85, 120),
    attack: randomInRange(45, 75),
    defense: randomInRange(35, 65),
    speed: randomInRange(30, 90),
    farePressure: 50,
  }
}

const TYPE_NAMES: Record<FareMonType, string[]> = {
  Normal: genericNames,
  Fire: fireNames,
  Water: waterNames,
  Grass: grassNames,
  Electric: ['Spark Shuttle', 'Volt Vixen', 'Amp Avenue', 'Relay Rabbit'],
  Ice: ['Frost Ferry', 'Rime Runner', 'Glacier Cab', 'Sleet Sprite'],
  Fighting: ['Brawl Bus', 'Jab Jet', 'Sparrow Lane', 'Grit Gryphon'],
  Poison: ['Fume Ferret', 'Venom Van', 'Acid Alley Cat', 'Smog Moth'],
  Ground: ['Terra Taxi', 'Fault Fox', 'Clay Courier', 'Dust Drake'],
  Flying: ['Skim Shuttle', 'Gale Gremlin', 'Draft Drake', 'Nimbus Newt'],
  Psychic: ['Mind Mantis', 'Pulse Pixie', 'Third-Eye Newt', 'Oracle Otter'],
  Bug: ['Thread Tick', 'Knot Moth', 'Chitin Cub', 'Lattice Ladybug'],
  Rock: ['Boulder Beetle', 'Slab Slug', 'Quarry Quail', 'Crag Crawler'],
  Ghost: ['Phase Ferret', 'Shade Shuttle', 'Wisp Wren', 'Echo Eidolon'],
  Dragon: ['Draco Drift', 'Scale Shuttle', 'Ridge Rider', 'Gale Drake'],
  Dark: ['Umbra Uber', 'Night Newt', 'Shroud Shrew', 'Murk Mantis'],
  Steel: ['Iron Iguana', 'Gear Gryphon', 'Plate Possum', 'Rivet Rabbit'],
  Fairy: ['Glimmer Gremlin', 'Charm Chick', 'Lumin Lynx', 'Aura Alley Cat'],
}

export function createRandomFareMon(primaryType: FareMonType, _ownerId: 1 | 2, secondaryType?: FareMonType | null): FareMon {
  const pool = TYPE_NAMES[primaryType] ?? genericNames
  const name = randomFromArray(pool)
  const stats = generateFareMonStats()
  const sec = secondaryType && secondaryType !== primaryType ? secondaryType : null
  const oddsSecondary = 0 // hackathon: primary only from team select
  const secondary = sec ?? (Math.random() < oddsSecondary ? randomFromArray(ALL_FAREMON_TYPES.filter((t) => t !== primaryType)) : null)

  return {
    id: generateId(),
    name,
    primaryType,
    secondaryType: secondary,
    maxHP: stats.maxHP,
    currentHP: stats.maxHP,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    farePressure: stats.farePressure,
    imagePrompt: `Original ride-hailing elemental creature, types ${primaryType}${secondary ? ` and ${secondary}` : ''}, minimalist pixel-art monster style, inspired by Singapore peak-hour transport energy, named ${name}, no copyrighted characters, no logos, no text.`,
    moves: generateFareMonMoves(primaryType, secondary),
    ...emptyStagesFareMon(),
  }
}

export function getActiveFareMon(team: FareMonTeam): FareMon | null {
  return team.activeFareMonIndex === 0 ? team.faremon1 : team.faremon2
}

export function getEffectiveSpeed(fm: FareMon): number {
  let s = fm.speed * getStageMultiplier(fm.speedStage)
  if (fm.majorStatus === 'Paralysis') s *= 0.5
  return Math.max(1, s)
}

function modifiedAttack(fm: FareMon): number {
  return Math.max(1, fm.attack * getStageMultiplier(fm.attackStage))
}

function modifiedDefense(fm: FareMon): number {
  return Math.max(1, fm.defense * getStageMultiplier(fm.defenseStage))
}

function hitChance(move: FareMonMove, attacker: FareMon, defender: FareMon): number {
  const acc = move.accuracy * (getStageMultiplier(attacker.accuracyStage) / getStageMultiplier(defender.evasionStage))
  return Math.min(100, Math.max(5, acc))
}

export function calculateFareMonDamage(
  attacker: FareMon,
  defender: FareMon,
  move: FareMonMove,
  typeMult: number,
  actingFirst: boolean,
): { damage: number; multiplier: number; missed: boolean } {
  if (move.category !== 'Damage') {
    return { damage: 0, multiplier: typeMult, missed: false }
  }

  if (typeMult === 0) {
    return { damage: 0, multiplier: 0, missed: false }
  }

  const roll = Math.random() * 100
  if (roll > hitChance(move, attacker, defender)) {
    return { damage: 0, multiplier: typeMult, missed: true }
  }

  let power = move.power
  if (move.bonusIfPoisoned && defender.majorStatus === 'Poison') {
    power += move.bonusIfPoisoned
  }
  if (move.name === 'Ambush Route' && actingFirst) {
    power = Math.round(power * 1.35)
  }

  const atk = modifiedAttack(attacker)
  const def = modifiedDefense(defender)
  let baseDamage = ((power * atk) / def) / 5

  const stab =
    move.type === attacker.primaryType || move.type === attacker.secondaryType ? 1.2 : 1
  const variance = 0.85 + Math.random() * 0.15
  let finalDamage = Math.round(baseDamage * typeMult * stab * variance)

  if (attacker.majorStatus === 'Burn') {
    finalDamage = Math.round(finalDamage * 0.7)
  }

  if (defender.shieldTurnsRemaining > 0) {
    finalDamage = Math.round(finalDamage * 0.6)
  }

  if (finalDamage > 0 && finalDamage < 5) finalDamage = 5

  return { damage: finalDamage, multiplier: typeMult, missed: false }
}

export function tryApplyMajorStatus(
  target: FareMon,
  status: MajorStatus,
  log: string[],
  sleepRange?: { min: number; max: number },
): boolean {
  if (target.majorStatus && target.majorStatus !== status) {
    log.push(`${target.name} already has a major condition.`)
    return false
  }
  if (target.majorStatus === status) {
    log.push(`${target.name} is already affected.`)
    return false
  }
  target.majorStatus = status
  if (status === 'Sleep') {
    if (sleepRange) {
      const turns = randomInRange(sleepRange.min, sleepRange.max)
      target.sleepTurnsRemaining = turns + 1
    } else {
      target.sleepTurnsRemaining = randomInRange(2, 3)
    }
  } else {
    target.sleepTurnsRemaining = 0
  }
  return true
}

function applyStatChangesTo(fm: FareMon, ch: StatChanges | undefined, log: string[], subjectName: string) {
  if (!ch) return
  const parts: string[] = []
  if (ch.attack) {
    fm.attackStage = applyStageDelta(fm.attackStage, ch.attack)
    parts.push(`ATK ${ch.attack > 0 ? '+' : ''}${ch.attack}`)
  }
  if (ch.defense) {
    fm.defenseStage = applyStageDelta(fm.defenseStage, ch.defense)
    parts.push(`DEF ${ch.defense > 0 ? '+' : ''}${ch.defense}`)
  }
  if (ch.speed) {
    fm.speedStage = applyStageDelta(fm.speedStage, ch.speed)
    parts.push(`SPD ${ch.speed > 0 ? '+' : ''}${ch.speed}`)
  }
  if (ch.accuracy) {
    fm.accuracyStage = applyStageDelta(fm.accuracyStage, ch.accuracy)
    parts.push(`ACC ${ch.accuracy > 0 ? '+' : ''}${ch.accuracy}`)
  }
  if (ch.evasion) {
    fm.evasionStage = applyStageDelta(fm.evasionStage, ch.evasion)
    parts.push(`EVA ${ch.evasion > 0 ? '+' : ''}${ch.evasion}`)
  }
  if (parts.length) log.push(`${subjectName}: ${parts.join(', ')}`)
}

function paralysisBlocks(): boolean {
  return Math.random() < 0.25
}

function syncTeamSlot(team: FareMonTeam, fm: FareMon) {
  if (team.activeFareMonIndex === 0) team.faremon1 = fm
  else team.faremon2 = fm
}

function executeMoveInPlace(
  s: FareMonBattleState,
  attackerId: 1 | 2,
  move: FareMonMove,
  actingFirst: boolean,
): void {
  const log = s.battleLog
  const atkTeam = attackerId === 1 ? s.player1Team : s.player2Team
  const defTeam = attackerId === 1 ? s.player2Team : s.player1Team
  let attacker = getActiveFareMon(atkTeam)!
  let defender = getActiveFareMon(defTeam)!

  const typeMult = totalTypeMultiplier(move.type, defender.primaryType, defender.secondaryType)
  const eff = getEffectivenessLabel(typeMult)

  if (move.category === 'Damage') {
    const { damage, missed, multiplier } = calculateFareMonDamage(attacker, defender, move, typeMult, actingFirst)
    log.push(`${attacker.name} used ${move.name}!`)
    if (multiplier === 0 && !missed) {
      log.push(`It has no effect on ${defender.name}.`)
      s.effectivenessMessage = 'No effect'
    } else if (missed) {
      log.push(`It missed!`)
      s.effectivenessMessage = 'Missed!'
    } else {
      if (defender.shieldTurnsRemaining > 0) {
        log.push(`${defender.name} shielded the impact.`)
      }
      defender.currentHP = Math.max(0, defender.currentHP - damage)
      s.effectivenessMessage = eff
      log.push(`${defender.name} took ${damage} damage!`)
    }
    if (move.statChanges && !missed && multiplier > 0) {
      applyStatChangesTo(defender, move.statChanges, log, defender.name)
    }
    if (move.selfStatChanges) {
      applyStatChangesTo(attacker, move.selfStatChanges, log, attacker.name)
    }
    if (move.statusChance && move.statusEffect && !missed && damage > 0 && multiplier > 0) {
      if (Math.random() * 100 < move.statusChance) {
        if (tryApplyMajorStatus(defender, move.statusEffect, log)) {
          log.push(`${defender.name} was afflicted!`)
        }
      }
    }
  } else if (move.category === 'Stat Boost' || move.category === 'Recovery' || move.category === 'Shield') {
    const target = move.target === 'self' ? attacker : defender
    log.push(`${attacker.name} used ${move.name}!`)
    if (move.category === 'Recovery' && move.healPercent && target === attacker) {
      const heal = Math.round((attacker.maxHP * move.healPercent) / 100)
      attacker.currentHP = Math.min(attacker.maxHP, attacker.currentHP + heal)
      log.push(`${attacker.name} recovered ${heal} HP.`)
    }
    if (move.appliesShield && target === attacker) {
      attacker.shieldTurnsRemaining = 1
      log.push(`${attacker.name} braced for impact.`)
    }
    if (move.statChanges) {
      applyStatChangesTo(target, move.statChanges, log, target.name)
    }
    s.effectivenessMessage = move.category === 'Shield' ? 'Shield up' : 'Move complete'
  } else if (move.category === 'Stat Debuff' || move.category === 'Disruption') {
    log.push(`${attacker.name} used ${move.name}!`)
    const roll = Math.random() * 100
    if (roll > hitChance(move, attacker, defender)) {
      log.push(`${defender.name} avoided the effect!`)
      s.effectivenessMessage = 'Missed!'
    } else {
      if (move.statChanges) {
        applyStatChangesTo(defender, move.statChanges, log, defender.name)
      }
      if (move.power > 0) {
        const { damage, missed, multiplier } = calculateFareMonDamage(attacker, defender, move, typeMult, actingFirst)
        if (multiplier === 0 && !missed) {
          log.push(`It has no effect on ${defender.name}.`)
        } else if (!missed) {
          defender.currentHP = Math.max(0, defender.currentHP - damage)
          log.push(`${defender.name} took ${damage} damage!`)
        }
      }
      s.effectivenessMessage = 'Hit'
    }
  } else if (move.category === 'Status') {
    log.push(`${attacker.name} used ${move.name}!`)
    const roll = Math.random() * 100
    if (roll > hitChance(move, attacker, defender)) {
      log.push(`It failed to apply!`)
      s.effectivenessMessage = 'Missed!'
    } else if (move.statusEffect) {
      const sleepRange =
        move.statusEffect === 'Sleep' && move.sleepTurnsMin != null && move.sleepTurnsMax != null
          ? { min: move.sleepTurnsMin, max: move.sleepTurnsMax }
          : undefined
      if (move.statusEffect === 'Sleep') {
        if (tryApplyMajorStatus(defender, 'Sleep', log, sleepRange)) {
          log.push(`${defender.name} fell asleep!`)
        }
      } else {
        if (tryApplyMajorStatus(defender, move.statusEffect, log)) {
          log.push(`${move.statusEffect} applied.`)
        }
      }
      s.effectivenessMessage = 'Status applied'
    }
  } else if (move.category === 'Setup') {
    log.push(`${attacker.name} used ${move.name}!`)
    if (move.setupDelayedDamage) {
      defender.pendingSetupDamage += move.setupDelayedDamage
      log.push(`Energy is building against ${defender.name}...`)
    }
    if (move.statChanges) {
      applyStatChangesTo(move.target === 'self' ? attacker : defender, move.statChanges, log, move.target === 'self' ? attacker.name : defender.name)
    }
    s.effectivenessMessage = 'Charging'
  }

  syncTeamSlot(atkTeam, attacker)
  syncTeamSlot(defTeam, defender)
}

function startOfTurnTick(fm: FareMon | null, log: string[], label: string) {
  if (!fm) return
  if (fm.majorStatus === 'Sleep' && fm.sleepTurnsRemaining > 0) {
    fm.sleepTurnsRemaining -= 1
    if (fm.sleepTurnsRemaining <= 0) {
      fm.majorStatus = null
      log.push(`${fm.name} woke up!`)
    }
  }
  if (fm.pendingSetupDamage > 0) {
    const d = fm.pendingSetupDamage
    fm.pendingSetupDamage = 0
    fm.currentHP = Math.max(0, fm.currentHP - d)
    log.push(`${fm.name} was struck by delayed energy for ${d} damage!`)
  }
}

function endOfTurnStatus(fm: FareMon | null, log: string[]) {
  if (!fm || fm.currentHP <= 0) return
  if (fm.majorStatus === 'Poison') {
    const dmg = Math.round(fm.maxHP * 0.08)
    fm.currentHP = Math.max(0, fm.currentHP - dmg)
    log.push(`${fm.name} is hurt by poison.`)
  }
  if (fm.majorStatus === 'Burn') {
    const dmg = Math.round(fm.maxHP * 0.06)
    fm.currentHP = Math.max(0, fm.currentHP - dmg)
    log.push(`${fm.name} is hurt by burn.`)
  }
}

function clearShieldsEndTurn(fm: FareMon | null) {
  if (!fm) return
  if (fm.shieldTurnsRemaining > 0) {
    fm.shieldTurnsRemaining -= 1
    if (fm.shieldTurnsRemaining < 0) fm.shieldTurnsRemaining = 0
  }
}

export function switchFareMon(state: FareMonBattleState, playerId: 1 | 2): FareMonBattleState {
  const newState = structuredClone(state)
  const team = playerId === 1 ? newState.player1Team : newState.player2Team
  const currentIndex = team.activeFareMonIndex
  const newIndex = currentIndex === 0 ? 1 : 0
  const newActive = newIndex === 0 ? team.faremon1 : team.faremon2
  const oldActive = currentIndex === 0 ? team.faremon1 : team.faremon2

  if (oldActive) oldActive.shieldTurnsRemaining = 0

  if (newActive && newActive.currentHP > 0) {
    team.activeFareMonIndex = newIndex as 0 | 1
    newState.battleLog = [...newState.battleLog, `${labelPlayer(playerId)} switched to ${newActive.name}!`]
  }

  if (playerId === 1) newState.player1Team = team
  else newState.player2Team = team

  return newState
}

function labelPlayer(id: 1 | 2) {
  return `Player ${id}`
}

export function checkFareMonDefeated(state: FareMonBattleState, playerId: 1 | 2): boolean {
  const active = getActiveFareMon(playerId === 1 ? state.player1Team : state.player2Team)
  return active ? active.currentHP <= 0 : true
}

export function hasRemainingFareMon(state: FareMonBattleState, playerId: 1 | 2): boolean {
  const team = playerId === 1 ? state.player1Team : state.player2Team
  return (team.faremon1?.currentHP ?? 0) > 0 || (team.faremon2?.currentHP ?? 0) > 0
}

export function autoSwitchIfNeeded(state: FareMonBattleState, playerId: 1 | 2): FareMonBattleState {
  const team = playerId === 1 ? state.player1Team : state.player2Team
  const active = getActiveFareMon(team)
  if (active && active.currentHP <= 0) {
    const reserveIndex = team.activeFareMonIndex === 0 ? 1 : 0
    const reserve = reserveIndex === 0 ? team.faremon1 : team.faremon2
    if (reserve && reserve.currentHP > 0) {
      return switchFareMon(state, playerId)
    }
  }
  return state
}

type Queued = { player: 1 | 2; kind: PlayerActionKind; move: FareMonMove | null }

function canResolve(state: FareMonBattleState): boolean {
  if (!state.player1Locked || !state.player2Locked) return false
  if (!state.player1Action || !state.player2Action) return false
  if (state.player1Action === 'move' && !state.player1SelectedMove) return false
  if (state.player2Action === 'move' && !state.player2SelectedMove) return false
  return true
}

function attemptParalysisSkip(fm: FareMon | null, log: string[]): boolean {
  if (!fm || fm.majorStatus !== 'Paralysis') return false
  if (paralysisBlocks()) {
    log.push(`${fm.name} is paralyzed and could not move.`)
    return true
  }
  return false
}

function sleepBlocks(fm: FareMon | null, log: string[]): boolean {
  if (!fm || fm.majorStatus !== 'Sleep') return false
  log.push(`${fm.name} is asleep and cannot move.`)
  return true
}

export function resolveFareMonTurn(state: FareMonBattleState): FareMonBattleState {
  if (!canResolve(state)) return state

  const s = structuredClone(state)
  const log = s.battleLog

  const p1a = getActiveFareMon(s.player1Team)
  const p2a = getActiveFareMon(s.player2Team)

  startOfTurnTick(p1a, log, 'p1')
  startOfTurnTick(p2a, log, 'p2')

  if (p1a && p1a.currentHP <= 0 && !hasRemainingFareMon(s, 1)) {
    s.gameOver = true
    s.winner = 2
    s.phase = 'result'
    resetLocks(s)
    return s
  }
  if (p2a && p2a.currentHP <= 0 && !hasRemainingFareMon(s, 2)) {
    s.gameOver = true
    s.winner = 1
    s.phase = 'result'
    resetLocks(s)
    return s
  }

  if (s.player1Action === 'switch') {
    Object.assign(s, switchFareMon(s, 1))
  }
  if (s.player2Action === 'switch') {
    Object.assign(s, switchFareMon(s, 2))
  }

  if (s.player1Action === 'switch' && s.player2Action === 'switch') {
    const d1 = getActiveFareMon(s.player1Team)
    const d2 = getActiveFareMon(s.player2Team)
    endOfTurnStatus(d1, s.battleLog)
    endOfTurnStatus(d2, s.battleLog)
    clearShieldsEndTurn(getActiveFareMon(s.player1Team))
    clearShieldsEndTurn(getActiveFareMon(s.player2Team))
    return endTurnCleanup(s)
  }

  const queue: Queued[] = []
  if (s.player1Action === 'move' && s.player1SelectedMove) {
    queue.push({ player: 1, kind: 'move', move: s.player1SelectedMove })
  }
  if (s.player2Action === 'move' && s.player2SelectedMove) {
    queue.push({ player: 2, kind: 'move', move: s.player2SelectedMove })
  }

  queue.sort((a, b) => {
    const ma = a.move!
    const mb = b.move!
    if (ma.priority !== mb.priority) return mb.priority - ma.priority
    const sa = getEffectiveSpeed(getActiveFareMon(a.player === 1 ? s.player1Team : s.player2Team)!)
    const sb = getEffectiveSpeed(getActiveFareMon(b.player === 1 ? s.player1Team : s.player2Team)!)
    if (sa !== sb) return sb - sa
    return Math.random() > 0.5 ? 1 : -1
  })

  const firstQ = queue[0]
  for (const q of queue) {
    const attacker = getActiveFareMon(q.player === 1 ? s.player1Team : s.player2Team)
    const defender = getActiveFareMon(q.player === 1 ? s.player2Team : s.player1Team)
    if (!attacker || !defender || attacker.currentHP <= 0) continue
    if (defender.currentHP <= 0) continue

    if (sleepBlocks(attacker, log)) continue
    if (attemptParalysisSkip(attacker, log)) continue

    const actingFirst = firstQ === q
    executeMoveInPlace(s, q.player, q.move!, actingFirst)

    const defAfter = q.player === 1 ? getActiveFareMon(s.player2Team) : getActiveFareMon(s.player1Team)
    if (defAfter && defAfter.currentHP <= 0) {
      const loser = q.player === 1 ? 2 : 1
      Object.assign(s, autoSwitchIfNeeded(s, loser))
      if (!hasRemainingFareMon(s, loser)) {
        s.gameOver = true
        s.winner = q.player
        s.phase = 'result'
        resetLocks(s)
        return s
      }
    }
  }

  const e1 = getActiveFareMon(s.player1Team)
  const e2 = getActiveFareMon(s.player2Team)
  endOfTurnStatus(e1, log)
  endOfTurnStatus(e2, log)
  clearShieldsEndTurn(e1)
  clearShieldsEndTurn(e2)

  if (e1 && e1.currentHP <= 0 && !hasRemainingFareMon(s, 1)) {
    s.gameOver = true
    s.winner = 2
    s.phase = 'result'
    resetLocks(s)
    return s
  }
  if (e2 && e2.currentHP <= 0 && !hasRemainingFareMon(s, 2)) {
    s.gameOver = true
    s.winner = 1
    s.phase = 'result'
    resetLocks(s)
    return s
  }

  return endTurnCleanup(s)
}

function syncActiveMon(team: FareMonTeam, fm: FareMon | null): FareMonTeam {
  if (!fm) return team
  const copy = { ...team }
  if (copy.activeFareMonIndex === 0) copy.faremon1 = fm
  else copy.faremon2 = fm
  return copy
}

function resetLocks(st: FareMonBattleState) {
  st.player1SelectedMove = null
  st.player2SelectedMove = null
  st.player1Action = null
  st.player2Action = null
  st.player1Locked = false
  st.player2Locked = false
}

function endTurnCleanup(s: FareMonBattleState): FareMonBattleState {
  resetLocks(s)
  if (!s.gameOver) {
    s.currentTurn += 1
    if (s.currentTurn > s.maxTurns) {
      s.gameOver = true
      s.winner = determineFareMonWinner(s)
      s.phase = 'result'
    }
  }
  return s
}

export function determineFareMonWinner(state: FareMonBattleState): 1 | 2 {
  const p1Active = getActiveFareMon(state.player1Team)
  const p2Active = getActiveFareMon(state.player2Team)
  const p1HP = p1Active?.currentHP ?? 0
  const p2HP = p2Active?.currentHP ?? 0
  if (p1HP > p2HP) return 1
  if (p2HP > p1HP) return 2
  const p1TotalHP =
    (state.player1Team.faremon1?.currentHP ?? 0) + (state.player1Team.faremon2?.currentHP ?? 0)
  const p2TotalHP =
    (state.player2Team.faremon1?.currentHP ?? 0) + (state.player2Team.faremon2?.currentHP ?? 0)
  if (p1TotalHP > p2TotalHP) return 1
  if (p2TotalHP > p1TotalHP) return 2
  const p1Pressure = p1Active?.farePressure ?? 100
  const p2Pressure = p2Active?.farePressure ?? 100
  if (p1Pressure < p2Pressure) return 1
  if (p2Pressure < p1Pressure) return 2
  return Math.random() > 0.5 ? 1 : 2
}

export function createEmptyTeam(): FareMonTeam {
  return {
    faremon1: null,
    faremon2: null,
    activeFareMonIndex: 0,
    selectedTypes: [],
    locked: false,
  }
}

export function createInitialFareMonBattleState(): FareMonBattleState {
  return {
    phase: 'type-selection',
    player1Team: createEmptyTeam(),
    player2Team: createEmptyTeam(),
    player1SelectedMove: null,
    player2SelectedMove: null,
    player1Action: null,
    player2Action: null,
    player1Locked: false,
    player2Locked: false,
    currentTurn: 1,
    maxTurns: 15,
    battleLog: [],
    effectivenessMessage: null,
    gameOver: false,
    winner: null,
    backgroundPrompt:
      'Pixel-art mobile battle background, original monster-duel inspired composition, rainy Singapore expressway during peak hour, glowing green route lines, digital fare meters, soft neon reflections, vertical mobile battle layout, opponent area top-right, player area bottom-left, no copyrighted characters, no logos, no text, no UI buttons.',
    arenaPrompt:
      'Singapore peak-hour battle arena, neon route lines, fare meter displays, rain effects, urban transport energy, no copyrighted elements.',
  }
}

export function selectType(
  state: FareMonBattleState,
  playerId: 1 | 2,
  type: FareMonType,
): FareMonBattleState {
  const newState = structuredClone(state)
  const team = playerId === 1 ? newState.player1Team : newState.player2Team
  if (team.locked) return state
  if (team.selectedTypes.includes(type)) {
    team.selectedTypes = team.selectedTypes.filter((t) => t !== type)
  } else if (team.selectedTypes.length < 2) {
    team.selectedTypes = [...team.selectedTypes, type]
  }
  if (playerId === 1) newState.player1Team = team
  else newState.player2Team = team
  return newState
}

export function applyGeneratedFareMonTeam(
  state: FareMonBattleState,
  playerId: 1 | 2,
  faremons: [FareMon, FareMon],
): FareMonBattleState {
  const newState = structuredClone(state)
  const team = playerId === 1 ? newState.player1Team : newState.player2Team
  if (team.selectedTypes.length !== 2) return state
  team.faremon1 = faremons[0]
  team.faremon2 = faremons[1]
  team.locked = true
  if (playerId === 1) newState.player1Team = team
  else newState.player2Team = team
  if (newState.player1Team.locked && newState.player2Team.locked) {
    newState.phase = 'battle'
  }
  return newState
}

export function getFareMonPlayerPerspective(state: FareMonBattleState, playerId: 1 | 2) {
  const ownTeam = playerId === 1 ? state.player1Team : state.player2Team
  const opponentTeam = playerId === 1 ? state.player2Team : state.player1Team
  return {
    ownTeam,
    opponentTeam,
    canSeeOpponentTypes: state.phase === 'battle' || state.phase === 'result',
    isLocked: playerId === 1 ? state.player1Locked : state.player2Locked,
    selectedMove: playerId === 1 ? state.player1SelectedMove : state.player2SelectedMove,
  }
}

/** Stage display helper for UI */
export function formatStages(fm: FareMon): string {
  const parts: string[] = []
  if (fm.attackStage) parts.push(`Atk${fm.attackStage > 0 ? '+' : ''}${fm.attackStage}`)
  if (fm.defenseStage) parts.push(`Def${fm.defenseStage > 0 ? '+' : ''}${fm.defenseStage}`)
  if (fm.speedStage) parts.push(`Spd${fm.speedStage > 0 ? '+' : ''}${fm.speedStage}`)
  if (fm.accuracyStage) parts.push(`Acc${fm.accuracyStage > 0 ? '+' : ''}${fm.accuracyStage}`)
  if (fm.evasionStage) parts.push(`Eva${fm.evasionStage > 0 ? '+' : ''}${fm.evasionStage}`)
  return parts.join(' ')
}

export function moveSummaryLines(move: FareMonMove): string[] {
  const lines: string[] = []
  if (move.category === 'Damage' && move.power > 0) {
    lines.push(`Power ${move.power} · Acc ${move.accuracy}`)
    if (move.statusChance && move.statusEffect) lines.push(`May inflict ${move.statusEffect}`)
  } else if (move.category === 'Stat Boost' || move.category === 'Stat Debuff') {
    const ch = move.statChanges
    if (ch) {
      const p: string[] = []
      if (ch.attack) p.push(`ATK ${ch.attack > 0 ? '+' : ''}${ch.attack}`)
      if (ch.defense) p.push(`DEF ${ch.defense > 0 ? '+' : ''}${ch.defense}`)
      if (ch.speed) p.push(`SPD ${ch.speed > 0 ? '+' : ''}${ch.speed}`)
      if (ch.accuracy) p.push(`ACC ${ch.accuracy > 0 ? '+' : ''}${ch.accuracy}`)
      if (ch.evasion) p.push(`EVA ${ch.evasion > 0 ? '+' : ''}${ch.evasion}`)
      lines.push(p.join(' · '))
    }
    lines.push(`Acc ${move.accuracy}`)
  } else if (move.category === 'Status') {
    if (move.statusEffect === 'Sleep') lines.push('Sleep 1–2 turns')
    else if (move.statusEffect) lines.push(move.statusEffect)
    lines.push(`Acc ${move.accuracy}`)
  } else if (move.category === 'Recovery') {
    if (move.healPercent) lines.push(`Heal ${move.healPercent}% max HP`)
    lines.push(`Acc ${move.accuracy}`)
  } else if (move.category === 'Shield') {
    lines.push('Blocks part of next hit')
    lines.push(`Acc ${move.accuracy}`)
  } else if (move.category === 'Setup') {
    if (move.setupDelayedDamage) lines.push(`Delayed strike next turn`)
    lines.push(`Acc ${move.accuracy}`)
  } else {
    lines.push(`Acc ${move.accuracy}`)
  }
  return lines
}

/** @deprecated Prefer getEffectivenessLabel; kept for older imports */
export function getEffectivenessText(multiplier: number): string {
  return getEffectivenessLabel(multiplier)
}

export function calculateTypeMultiplier(
  moveType: FareMonType,
  defenderPrimary: FareMonType,
  defenderSecondary?: FareMonType | null,
): number {
  return totalTypeMultiplier(moveType, defenderPrimary, defenderSecondary ?? null)
}
