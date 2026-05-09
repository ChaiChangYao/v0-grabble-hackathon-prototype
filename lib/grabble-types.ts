// Screen types
export type Screen =
  | 'home'
  | 'destination'
  | 'ride-options'
  | 'grabble-optin'
  | 'matchmaking'
  | 'faremon-duel'
  | 'battleroute'
  | 'results'
  | 'booking-confirmation'

export type GameType = 'faremon-duel' | 'battleroute'

// Player data
export interface Player {
  id: 1 | 2
  name: string
  pickup: string
  destination: string
  normalFare: number
  winnerFare: number
  loserFare: number
}

// FareMon types
export interface FareMonCreature {
  name: string
  type: string
  visualDescription: string
  hp: number
  maxHp: number
  shield: number
  farePressure: number
}

export interface FareMonMove {
  name: string
  type: 'Attack' | 'Defense' | 'Strategy' | 'Power'
  effect: string
  risk: 'Low' | 'Medium' | 'High'
  description: string
}

export interface FareMonState {
  player1Creature: FareMonCreature
  player2Creature: FareMonCreature
  currentTurn: number
  maxTurns: number
  player1Move: FareMonMove | null
  player2Move: FareMonMove | null
  battleLog: string[]
  aiCommentary: string
  gameOver: boolean
  winner: 1 | 2 | null
}

// Fare Blocks types
export type BlockPiece = {
  id: string
  shape: boolean[][]
  name: string
}

export interface FareBlocksPlayerState {
  grid: boolean[][]
  score: number
  surgePressure: number
  movesRemaining: number
  selectedPiece: BlockPiece | null
}

export interface FareBlocksState {
  player1: FareBlocksPlayerState
  player2: FareBlocksPlayerState
  availablePieces: BlockPiece[]
  currentPieceIndex: number
  aiHint: string
  modifier: {
    name: string
    effect: string
  }
  gameOver: boolean
  winner: 1 | 2 | null
}

// Game state
export interface GameState {
  currentScreen: Screen
  selectedRideOption: string | null
  player1: Player
  player2: Player
  matchedFareSimilarity: number
  selectedGame: GameType | null
  fareMonState: FareMonState | null
  fareBlocksState: FareBlocksState | null
  winner: 1 | 2 | null
  aiCommentary: string[]
}

// Default players
export const defaultPlayer1: Player = {
  id: 1,
  name: 'CY',
  pickup: 'Tanjong Pagar',
  destination: 'Changi Airport T3',
  normalFare: 24.80,
  winnerFare: 12.40,
  loserFare: 37.20,
}

export const defaultPlayer2: Player = {
  id: 2,
  name: 'Rival Rider',
  pickup: 'Orchard',
  destination: 'Pasir Ris',
  normalFare: 24.60,
  winnerFare: 12.30,
  loserFare: 36.90,
}

// FareMon creatures
export const player1Creature: FareMonCreature = {
  name: 'Surge Serpent',
  type: 'Peak-Hour Trickster',
  visualDescription: 'A sleek neon-green serpent made of road lines, traffic lights, glowing fare meters, and route arrows.',
  hp: 100,
  maxHp: 100,
  shield: 0,
  farePressure: 50,
}

export const player2Creature: FareMonCreature = {
  name: 'Terminal Tiger',
  type: 'Airport Sprinter',
  visualDescription: 'A futuristic tiger with taxi-light stripes, luggage-tag armor, expressway markings, and route-map energy.',
  hp: 100,
  maxHp: 100,
  shield: 0,
  farePressure: 50,
}

// Player 1 moves
export const player1Moves: FareMonMove[] = [
  {
    name: 'Surge Bite',
    type: 'Attack',
    effect: 'Deals 18 damage',
    risk: 'Low',
    description: 'A reliable attack powered by peak-hour surge energy.',
  },
  {
    name: 'Green Shield',
    type: 'Defense',
    effect: 'Adds 15 shield',
    risk: 'Low',
    description: 'Uses Grab-green route energy to reduce incoming damage.',
  },
  {
    name: 'Route Hack',
    type: 'Strategy',
    effect: '8 dmg + 15 pressure',
    risk: 'Medium',
    description: 'Re-routes the opponent into a higher-friction path.',
  },
  {
    name: 'Peak Rush',
    type: 'Power',
    effect: '50% for 35 or 10 self-dmg',
    risk: 'High',
    description: 'A risky all-in move during peak-hour chaos.',
  },
]

// Player 2 moves
export const player2Moves: FareMonMove[] = [
  {
    name: 'Terminal Dash',
    type: 'Attack',
    effect: 'Deals 18 damage',
    risk: 'Low',
    description: 'A fast expressway attack from the airport lane.',
  },
  {
    name: 'Luggage Guard',
    type: 'Defense',
    effect: 'Adds 15 shield',
    risk: 'Low',
    description: 'Uses luggage-tag armor to absorb incoming damage.',
  },
  {
    name: 'Fare Spike',
    type: 'Strategy',
    effect: '8 dmg + 15 pressure',
    risk: 'Medium',
    description: 'Pushes the opponent into a sudden price surge.',
  },
  {
    name: 'Express Claw',
    type: 'Power',
    effect: '50% for 35 or 10 self-dmg',
    risk: 'High',
    description: 'A powerful but unstable express-lane strike.',
  },
]

// Block pieces for Fare Blocks
export const blockPieces: BlockPiece[] = [
  { id: 'single', name: 'Single', shape: [[true]] },
  { id: 'two-h', name: 'Two Horizontal', shape: [[true, true]] },
  { id: 'three-v', name: 'Three Vertical', shape: [[true], [true], [true]] },
  { id: 'l-shape', name: 'L-Shape', shape: [[true, false], [true, true]] },
  { id: 'square', name: 'Square', shape: [[true, true], [true, true]] },
  { id: 'three-h', name: 'Three Horizontal', shape: [[true, true, true]] },
  { id: 'corner', name: 'Corner Route', shape: [[true, true], [true, false]] },
]

// Traffic modifiers
export const trafficModifiers = [
  { name: 'Rain Surge', effect: 'Invalid placements increase surge pressure faster.' },
  { name: 'ERP Rush', effect: 'Clearing columns gives extra points.' },
  { name: 'Airport Demand', effect: 'Combos reduce surge pressure more.' },
  { name: 'CBD Jam', effect: 'Central grid spaces are more valuable.' },
]

// AI hints for Fare Blocks
export const fareBlocksHints = [
  'Keep the center open. Your next L-shape needs turning space.',
  'A horizontal block can set up a row clear next turn.',
  'This move may trap your square block.',
  'Focus on completing rows first, then columns.',
  'Clear the middle lane first for more future options.',
]

// AI commentary for FareMon
export const fareMonCommentary = [
  'CY is playing aggressively, but the fare pressure is getting dangerous.',
  'Rival Rider chose defense at the right time.',
  'Route Hack increased the opponent\'s fare pressure. Smart move.',
  'Peak Rush is risky. Big reward, but it can backfire.',
  'This is strategy-based, not reflex-based.',
  'The shield expired. Watch out for the next attack!',
  'Both players are evenly matched. This could go either way.',
]
