// FareMon Type-Based Battle Engine
// Fire > Grass > Water > Fire

export type FareMonType = 'fire' | 'grass' | 'water'

export interface FareMonMove {
  id: string
  name: string
  type: FareMonType | 'neutral'
  category: 'attack' | 'defense' | 'strategy' | 'power'
  power: number
  accuracy: number
  effect: string
  description: string
}

export interface FareMon {
  id: string
  name: string
  type: FareMonType
  maxHP: number
  currentHP: number
  attack: number
  defense: number
  speed: number
  farePressure: number
  imagePrompt: string
  moves: FareMonMove[]
}

export interface FareMonTeam {
  faremon1: FareMon | null
  faremon2: FareMon | null
  activeFareMonIndex: 0 | 1
  selectedTypes: FareMonType[]
  locked: boolean
}

export interface FareMonBattleState {
  phase: 'type-selection' | 'generating' | 'battle' | 'result'
  player1Team: FareMonTeam
  player2Team: FareMonTeam
  player1SelectedMove: FareMonMove | null
  player2SelectedMove: FareMonMove | null
  player1Action: 'move' | 'switch' | null
  player2Action: 'move' | 'switch' | null
  player1Locked: boolean
  player2Locked: boolean
  currentTurn: number
  maxTurns: number
  battleLog: string[]
  effectivenessMessage: string | null
  gameOver: boolean
  winner: 1 | 2 | null
  backgroundPrompt: string
  arenaPrompt: string
}

// FareMon name pools
const fireNames = ['Surge Ember', 'Meter Drake', 'Heatlane Fox', 'Flare Cabbit', 'Peak Pyro', 'Ignite Rider', 'Blaze Shuttle', 'Thermal Dash']
const grassNames = ['Route Sprout', 'Garden Glide', 'Leafline Lynx', 'Greenway Manta', 'Canopy Cabbit', 'Verdant Cruiser', 'Foliage Flyer', 'Moss Meter']
const waterNames = ['Rainstream Otter', 'Hydro Taxi', 'Monsoon Manta', 'Riverlane Serpent', 'Drizzle Dash', 'Tide Runner', 'Aqua Express', 'Current Courier']

// Move templates
const fireMoves: Omit<FareMonMove, 'id'>[] = [
  { name: 'Surge Flame', type: 'fire', category: 'attack', power: 50, accuracy: 90, effect: 'Standard fire damage', description: 'Engulfs the opponent in peak-hour flame energy.' },
  { name: 'Peak Ember', type: 'fire', category: 'attack', power: 35, accuracy: 95, effect: 'Light fire damage', description: 'A quick burst of surge heat.' },
  { name: 'Meter Burn', type: 'fire', category: 'power', power: 90, accuracy: 60, effect: 'High damage, low accuracy', description: 'Overloads the fare meter with intense heat.' },
  { name: 'Heatwave Lane', type: 'fire', category: 'attack', power: 70, accuracy: 75, effect: 'Heavy fire damage', description: 'Sends a scorching wave down the expressway.' },
]

const grassMoves: Omit<FareMonMove, 'id'>[] = [
  { name: 'Green Route', type: 'grass', category: 'attack', power: 50, accuracy: 90, effect: 'Standard grass damage', description: 'Strikes with natural route energy.' },
  { name: 'Leaf Detour', type: 'grass', category: 'attack', power: 35, accuracy: 95, effect: 'Light grass damage', description: 'A swift leafy strike that reroutes the enemy.' },
  { name: 'Canopy Guard', type: 'grass', category: 'defense', power: 0, accuracy: 100, effect: 'Raises defense by 10', description: 'Creates a protective leaf canopy.' },
  { name: 'Garden Snare', type: 'grass', category: 'strategy', power: 40, accuracy: 85, effect: 'Damage + lowers speed', description: 'Entangles the opponent in vines.' },
]

const waterMoves: Omit<FareMonMove, 'id'>[] = [
  { name: 'Monsoon Rush', type: 'water', category: 'attack', power: 50, accuracy: 90, effect: 'Standard water damage', description: 'A powerful rush of monsoon water.' },
  { name: 'Rain Lane', type: 'water', category: 'attack', power: 35, accuracy: 95, effect: 'Light water damage', description: 'Splashes the opponent with rain.' },
  { name: 'Hydro Meter', type: 'water', category: 'power', power: 90, accuracy: 60, effect: 'High damage, low accuracy', description: 'Unleashes a torrent of meter energy.' },
  { name: 'Drizzle Shield', type: 'water', category: 'defense', power: 0, accuracy: 100, effect: 'Raises defense by 10', description: 'Creates a protective water barrier.' },
]

const neutralMoves: Omit<FareMonMove, 'id'>[] = [
  { name: 'Route Hack', type: 'neutral', category: 'strategy', power: 30, accuracy: 90, effect: 'Damage + 15 fare pressure', description: 'Hacks into the opponent route, increasing their fare.' },
  { name: 'Fare Spike', type: 'neutral', category: 'strategy', power: 25, accuracy: 95, effect: 'Low damage + 20 fare pressure', description: 'Spikes the opponent fare meter.' },
  { name: 'Lane Switch', type: 'neutral', category: 'defense', power: 0, accuracy: 100, effect: 'Raises speed by 15', description: 'Quickly switches to a faster lane.' },
  { name: 'Signal Delay', type: 'neutral', category: 'strategy', power: 35, accuracy: 85, effect: 'Damage + lowers accuracy', description: 'Delays the opponent signal.' },
]

// Helper functions
function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// Generate random FareMon stats
export function generateFareMonStats() {
  return {
    maxHP: randomInRange(85, 120),
    attack: randomInRange(45, 75),
    defense: randomInRange(35, 65),
    speed: randomInRange(30, 90),
    farePressure: 50,
  }
}

// Generate moves for a FareMon
export function generateFareMonMoves(type: FareMonType): FareMonMove[] {
  const typeMoves = type === 'fire' ? fireMoves : type === 'grass' ? grassMoves : waterMoves
  const moves: FareMonMove[] = []
  
  // 2 same-type moves
  const shuffledTypeMoves = [...typeMoves].sort(() => Math.random() - 0.5)
  moves.push({ ...shuffledTypeMoves[0], id: generateId() })
  moves.push({ ...shuffledTypeMoves[1], id: generateId() })
  
  // 1 neutral strategy move
  moves.push({ ...randomFromArray(neutralMoves), id: generateId() })
  
  // 1 random move (could be any type)
  const allMoves = [...fireMoves, ...grassMoves, ...waterMoves, ...neutralMoves]
  moves.push({ ...randomFromArray(allMoves), id: generateId() })
  
  return moves.slice(0, 4)
}

// Create a random FareMon
export function createRandomFareMon(type: FareMonType, ownerId: 1 | 2): FareMon {
  const names = type === 'fire' ? fireNames : type === 'grass' ? grassNames : waterNames
  const name = randomFromArray(names)
  const stats = generateFareMonStats()
  
  return {
    id: generateId(),
    name,
    type,
    maxHP: stats.maxHP,
    currentHP: stats.maxHP,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    farePressure: stats.farePressure,
    imagePrompt: `Original ride-hailing elemental creature, type: ${type}, minimalist pixel-art monster style, inspired by Singapore peak-hour transport energy, named ${name}, no copyrighted characters, no logos, no text.`,
    moves: generateFareMonMoves(type),
  }
}

// Calculate type multiplier
export function calculateTypeMultiplier(moveType: FareMonType | 'neutral', defenderType: FareMonType): number {
  if (moveType === 'neutral') return 1.0
  
  // Fire > Grass > Water > Fire
  if (moveType === 'fire' && defenderType === 'grass') return 2.0
  if (moveType === 'fire' && defenderType === 'water') return 0.5
  if (moveType === 'grass' && defenderType === 'water') return 2.0
  if (moveType === 'grass' && defenderType === 'fire') return 0.5
  if (moveType === 'water' && defenderType === 'fire') return 2.0
  if (moveType === 'water' && defenderType === 'grass') return 0.5
  
  return 1.0
}

// Get effectiveness text
export function getEffectivenessText(multiplier: number): string {
  if (multiplier >= 2.0) return 'Super effective!'
  if (multiplier <= 0.5) return 'Not very effective...'
  return 'Normal hit'
}

// Calculate damage
export function calculateFareMonDamage(
  attacker: FareMon, 
  defender: FareMon, 
  move: FareMonMove
): { damage: number; multiplier: number; missed: boolean } {
  // Accuracy check
  const accuracyRoll = Math.random() * 100
  if (accuracyRoll > move.accuracy) {
    return { damage: 0, multiplier: 1, missed: true }
  }
  
  // Base damage formula: ((move.power * attacker.attack) / defender.defense) / 5
  const baseDamage = ((move.power * attacker.attack) / defender.defense) / 5
  
  // Type multiplier
  const typeMultiplier = calculateTypeMultiplier(move.type, defender.type)
  
  // Same type attack bonus (STAB)
  const stab = move.type !== 'neutral' && move.type === attacker.type ? 1.2 : 1.0
  
  // Random variance (0.85 to 1.0)
  const variance = 0.85 + Math.random() * 0.15
  
  // Final damage
  let finalDamage = Math.round(baseDamage * typeMultiplier * stab * variance)
  
  // Minimum damage of 5 for damaging moves
  if (move.power > 0 && finalDamage < 5) finalDamage = 5
  
  return { damage: finalDamage, multiplier: typeMultiplier, missed: false }
}

// Determine move order by speed
export function determineMoveOrderBySpeed(
  player1FareMon: FareMon, 
  player2FareMon: FareMon
): { first: 1 | 2; second: 1 | 2 } {
  if (player1FareMon.speed > player2FareMon.speed) {
    return { first: 1, second: 2 }
  } else if (player2FareMon.speed > player1FareMon.speed) {
    return { first: 2, second: 1 }
  } else {
    // Speed tie - random
    const first = Math.random() > 0.5 ? 1 : 2
    return { first, second: first === 1 ? 2 : 1 }
  }
}

// Apply move effect
export function applyMoveEffect(
  state: FareMonBattleState,
  attackerId: 1 | 2,
  move: FareMonMove
): FareMonBattleState {
  const newState = { ...state }
  const attackerTeam = attackerId === 1 ? { ...state.player1Team } : { ...state.player2Team }
  const defenderTeam = attackerId === 1 ? { ...state.player2Team } : { ...state.player1Team }
  
  const attackerFareMon = attackerTeam.activeFareMonIndex === 0 
    ? { ...attackerTeam.faremon1! } 
    : { ...attackerTeam.faremon2! }
  const defenderFareMon = defenderTeam.activeFareMonIndex === 0 
    ? { ...defenderTeam.faremon1! } 
    : { ...defenderTeam.faremon2! }
  
  const log: string[] = [...state.battleLog]
  
  if (move.category === 'defense') {
    // Defense move - raise stats
    attackerFareMon.defense += 10
    log.push(`${attackerFareMon.name} used ${move.name}!`)
    log.push(`Defense rose!`)
    newState.effectivenessMessage = 'Defense increased!'
  } else if (move.category === 'strategy' && move.power === 0) {
    // Pure strategy move
    attackerFareMon.speed += 15
    log.push(`${attackerFareMon.name} used ${move.name}!`)
    log.push(`Speed rose!`)
    newState.effectivenessMessage = 'Speed increased!'
  } else {
    // Damaging move
    const { damage, multiplier, missed } = calculateFareMonDamage(attackerFareMon, defenderFareMon, move)
    
    log.push(`${attackerFareMon.name} used ${move.name}!`)
    
    if (missed) {
      log.push(`It missed!`)
      newState.effectivenessMessage = 'Missed!'
    } else {
      defenderFareMon.currentHP = Math.max(0, defenderFareMon.currentHP - damage)
      newState.effectivenessMessage = getEffectivenessText(multiplier)
      log.push(`${newState.effectivenessMessage}`)
      log.push(`${defenderFareMon.name} took ${damage} damage!`)
      
      // Strategy moves add fare pressure
      if (move.category === 'strategy' && move.effect.includes('fare pressure')) {
        const pressureIncrease = parseInt(move.effect.match(/\d+/)?.[0] || '15')
        defenderFareMon.farePressure = Math.min(100, defenderFareMon.farePressure + pressureIncrease)
        log.push(`${defenderFareMon.name}'s fare pressure increased!`)
      }
    }
  }
  
  // Update state
  if (attackerId === 1) {
    if (attackerTeam.activeFareMonIndex === 0) attackerTeam.faremon1 = attackerFareMon
    else attackerTeam.faremon2 = attackerFareMon
    newState.player1Team = attackerTeam
    
    if (defenderTeam.activeFareMonIndex === 0) defenderTeam.faremon1 = defenderFareMon
    else defenderTeam.faremon2 = defenderFareMon
    newState.player2Team = defenderTeam
  } else {
    if (attackerTeam.activeFareMonIndex === 0) attackerTeam.faremon1 = attackerFareMon
    else attackerTeam.faremon2 = attackerFareMon
    newState.player2Team = attackerTeam
    
    if (defenderTeam.activeFareMonIndex === 0) defenderTeam.faremon1 = defenderFareMon
    else defenderTeam.faremon2 = defenderFareMon
    newState.player1Team = defenderTeam
  }
  
  newState.battleLog = log
  return newState
}

// Switch FareMon
export function switchFareMon(state: FareMonBattleState, playerId: 1 | 2): FareMonBattleState {
  const newState = { ...state }
  const team = playerId === 1 ? { ...state.player1Team } : { ...state.player2Team }
  
  const currentIndex = team.activeFareMonIndex
  const newIndex = currentIndex === 0 ? 1 : 0
  const newActive = newIndex === 0 ? team.faremon1 : team.faremon2
  
  if (newActive && newActive.currentHP > 0) {
    team.activeFareMonIndex = newIndex as 0 | 1
    newState.battleLog = [...state.battleLog, `Player ${playerId} switched to ${newActive.name}!`]
  }
  
  if (playerId === 1) newState.player1Team = team
  else newState.player2Team = team
  
  return newState
}

// Check if FareMon is defeated
export function checkFareMonDefeated(state: FareMonBattleState, playerId: 1 | 2): boolean {
  const team = playerId === 1 ? state.player1Team : state.player2Team
  const active = team.activeFareMonIndex === 0 ? team.faremon1 : team.faremon2
  return active ? active.currentHP <= 0 : true
}

// Check if player has remaining FareMon
export function hasRemainingFareMon(state: FareMonBattleState, playerId: 1 | 2): boolean {
  const team = playerId === 1 ? state.player1Team : state.player2Team
  const fm1HP = team.faremon1?.currentHP ?? 0
  const fm2HP = team.faremon2?.currentHP ?? 0
  return fm1HP > 0 || fm2HP > 0
}

// Auto-switch to reserve if active is KO'd
export function autoSwitchIfNeeded(state: FareMonBattleState, playerId: 1 | 2): FareMonBattleState {
  const team = playerId === 1 ? state.player1Team : state.player2Team
  const active = team.activeFareMonIndex === 0 ? team.faremon1 : team.faremon2
  
  if (active && active.currentHP <= 0) {
    const reserveIndex = team.activeFareMonIndex === 0 ? 1 : 0
    const reserve = reserveIndex === 0 ? team.faremon1 : team.faremon2
    
    if (reserve && reserve.currentHP > 0) {
      return switchFareMon(state, playerId)
    }
  }
  
  return state
}

// Resolve a full turn
export function resolveFareMonTurn(state: FareMonBattleState): FareMonBattleState {
  if (!state.player1SelectedMove || !state.player2SelectedMove) return state
  
  let newState = { ...state }
  
  const p1Active = state.player1Team.activeFareMonIndex === 0 
    ? state.player1Team.faremon1! 
    : state.player1Team.faremon2!
  const p2Active = state.player2Team.activeFareMonIndex === 0 
    ? state.player2Team.faremon1! 
    : state.player2Team.faremon2!
  
  // Handle switches first
  if (state.player1Action === 'switch') {
    newState = switchFareMon(newState, 1)
  }
  if (state.player2Action === 'switch') {
    newState = switchFareMon(newState, 2)
  }
  
  // If both switched, end turn
  if (state.player1Action === 'switch' && state.player2Action === 'switch') {
    newState.player1SelectedMove = null
    newState.player2SelectedMove = null
    newState.player1Action = null
    newState.player2Action = null
    newState.player1Locked = false
    newState.player2Locked = false
    newState.currentTurn += 1
    return newState
  }
  
  // Determine move order by speed
  const { first, second } = determineMoveOrderBySpeed(p1Active, p2Active)
  
  // First attacker
  if (first === 1 && state.player1Action === 'move') {
    newState = applyMoveEffect(newState, 1, state.player1SelectedMove)
    
    // Check if defender KO'd
    const p2Team = newState.player2Team
    const p2ActiveFM = p2Team.activeFareMonIndex === 0 ? p2Team.faremon1 : p2Team.faremon2
    if (p2ActiveFM && p2ActiveFM.currentHP <= 0) {
      newState = autoSwitchIfNeeded(newState, 2)
      if (!hasRemainingFareMon(newState, 2)) {
        newState.gameOver = true
        newState.winner = 1
        newState.phase = 'result'
        return newState
      }
    }
  } else if (first === 2 && state.player2Action === 'move') {
    newState = applyMoveEffect(newState, 2, state.player2SelectedMove)
    
    const p1Team = newState.player1Team
    const p1ActiveFM = p1Team.activeFareMonIndex === 0 ? p1Team.faremon1 : p1Team.faremon2
    if (p1ActiveFM && p1ActiveFM.currentHP <= 0) {
      newState = autoSwitchIfNeeded(newState, 1)
      if (!hasRemainingFareMon(newState, 1)) {
        newState.gameOver = true
        newState.winner = 2
        newState.phase = 'result'
        return newState
      }
    }
  }
  
  // Second attacker (only if not KO'd)
  const secondAttacker = second === 1 ? newState.player1Team : newState.player2Team
  const secondActive = secondAttacker.activeFareMonIndex === 0 
    ? secondAttacker.faremon1 
    : secondAttacker.faremon2
    
  if (secondActive && secondActive.currentHP > 0) {
    if (second === 1 && state.player1Action === 'move') {
      newState = applyMoveEffect(newState, 1, state.player1SelectedMove)
      
      const p2Team = newState.player2Team
      const p2ActiveFM = p2Team.activeFareMonIndex === 0 ? p2Team.faremon1 : p2Team.faremon2
      if (p2ActiveFM && p2ActiveFM.currentHP <= 0) {
        newState = autoSwitchIfNeeded(newState, 2)
        if (!hasRemainingFareMon(newState, 2)) {
          newState.gameOver = true
          newState.winner = 1
          newState.phase = 'result'
          return newState
        }
      }
    } else if (second === 2 && state.player2Action === 'move') {
      newState = applyMoveEffect(newState, 2, state.player2SelectedMove)
      
      const p1Team = newState.player1Team
      const p1ActiveFM = p1Team.activeFareMonIndex === 0 ? p1Team.faremon1 : p1Team.faremon2
      if (p1ActiveFM && p1ActiveFM.currentHP <= 0) {
        newState = autoSwitchIfNeeded(newState, 1)
        if (!hasRemainingFareMon(newState, 1)) {
          newState.gameOver = true
          newState.winner = 2
          newState.phase = 'result'
          return newState
        }
      }
    }
  }
  
  // Check turn limit
  if (newState.currentTurn >= newState.maxTurns) {
    newState.gameOver = true
    newState.winner = determineFareMonWinner(newState)
    newState.phase = 'result'
    return newState
  }
  
  // Reset for next turn
  newState.player1SelectedMove = null
  newState.player2SelectedMove = null
  newState.player1Action = null
  newState.player2Action = null
  newState.player1Locked = false
  newState.player2Locked = false
  newState.currentTurn += 1
  
  return newState
}

// Determine winner at turn limit
export function determineFareMonWinner(state: FareMonBattleState): 1 | 2 {
  const p1Active = state.player1Team.activeFareMonIndex === 0 
    ? state.player1Team.faremon1 
    : state.player1Team.faremon2
  const p2Active = state.player2Team.activeFareMonIndex === 0 
    ? state.player2Team.faremon1 
    : state.player2Team.faremon2
  
  const p1HP = p1Active?.currentHP ?? 0
  const p2HP = p2Active?.currentHP ?? 0
  
  // 1. Higher active HP
  if (p1HP > p2HP) return 1
  if (p2HP > p1HP) return 2
  
  // 2. Higher total remaining HP
  const p1TotalHP = (state.player1Team.faremon1?.currentHP ?? 0) + (state.player1Team.faremon2?.currentHP ?? 0)
  const p2TotalHP = (state.player2Team.faremon1?.currentHP ?? 0) + (state.player2Team.faremon2?.currentHP ?? 0)
  if (p1TotalHP > p2TotalHP) return 1
  if (p2TotalHP > p1TotalHP) return 2
  
  // 3. Lower fare pressure
  const p1Pressure = p1Active?.farePressure ?? 100
  const p2Pressure = p2Active?.farePressure ?? 100
  if (p1Pressure < p2Pressure) return 1
  if (p2Pressure < p1Pressure) return 2
  
  // 4. Random sudden death
  return Math.random() > 0.5 ? 1 : 2
}

// Create initial team
export function createEmptyTeam(): FareMonTeam {
  return {
    faremon1: null,
    faremon2: null,
    activeFareMonIndex: 0,
    selectedTypes: [],
    locked: false,
  }
}

// Create initial battle state
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
    maxTurns: 10,
    battleLog: [],
    effectivenessMessage: null,
    gameOver: false,
    winner: null,
    backgroundPrompt: 'Pixel-art mobile battle background, original monster-duel inspired composition, rainy Singapore expressway during peak hour, glowing green route lines, digital fare meters, soft neon reflections, vertical mobile battle layout, opponent area top-right, player area bottom-left, no copyrighted characters, no logos, no text, no UI buttons.',
    arenaPrompt: 'Singapore peak-hour battle arena, neon route lines, fare meter displays, rain effects, urban transport energy, no copyrighted elements.',
  }
}

// Select type for team
export function selectType(state: FareMonBattleState, playerId: 1 | 2, type: FareMonType): FareMonBattleState {
  const newState = { ...state }
  const team = playerId === 1 ? { ...state.player1Team } : { ...state.player2Team }
  
  // Toggle type selection
  if (team.selectedTypes.includes(type)) {
    team.selectedTypes = team.selectedTypes.filter(t => t !== type)
  } else if (team.selectedTypes.length < 2) {
    // No duplicates allowed
    team.selectedTypes = [...team.selectedTypes, type]
  }
  
  if (playerId === 1) newState.player1Team = team
  else newState.player2Team = team
  
  return newState
}

// Lock in team selection
export function lockInTeam(state: FareMonBattleState, playerId: 1 | 2): FareMonBattleState {
  const newState = { ...state }
  const team = playerId === 1 ? { ...state.player1Team } : { ...state.player2Team }
  
  if (team.selectedTypes.length !== 2) return state
  
  // Generate FareMons based on selected types
  team.faremon1 = createRandomFareMon(team.selectedTypes[0], playerId)
  team.faremon2 = createRandomFareMon(team.selectedTypes[1], playerId)
  team.locked = true
  
  if (playerId === 1) newState.player1Team = team
  else newState.player2Team = team
  
  // Check if both locked
  if (newState.player1Team.locked && newState.player2Team.locked) {
    newState.phase = 'battle'
  }
  
  return newState
}

// Get player perspective (what they can see)
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
