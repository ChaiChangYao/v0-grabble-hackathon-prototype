export type FareMonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy'

export type MoveCategory =
  | 'Damage'
  | 'Stat Boost'
  | 'Stat Debuff'
  | 'Status'
  | 'Shield'
  | 'Recovery'
  | 'Setup'
  | 'Disruption'

export type MajorStatus = 'Sleep' | 'Poison' | 'Burn' | 'Paralysis'

export interface StatChanges {
  attack?: number
  defense?: number
  speed?: number
  accuracy?: number
  evasion?: number
}

export type MoveDpsRole =
  | 'burst'
  | 'sustain'
  | 'control'
  | 'defense'
  | 'setup'
  | 'disruption'
  | 'recovery'

export interface FareMonMove {
  id: string
  name: string
  type: FareMonType
  category: MoveCategory
  power: number
  accuracy: number
  priority: number
  target: 'self' | 'opponent'
  statChanges?: StatChanges
  /** Applied to user after move resolves (e.g. overstrike recoil). */
  selfStatChanges?: StatChanges
  statusEffect?: MajorStatus
  statusChance?: number
  healPercent?: number
  /** When true, move applies one-turn shield (40% damage reduction) */
  appliesShield?: boolean
  /** Setup: stores power to deal at start of next turn to opponent */
  setupDelayedDamage?: number
  /** Bonus power when target is poisoned */
  bonusIfPoisoned?: number
  /** Sleep duration range applied on hit */
  sleepTurnsMin?: number
  sleepTurnsMax?: number
  description: string
  iconPrompt?: string
  /** Optional status duration hint for UI (engine may not use) */
  duration?: number
  dpsRole?: MoveDpsRole
  /** Legacy one-line for logs / tooltips */
  effect?: string
}

export interface DpsProfile {
  burst: number
  sustain: number
  control: number
  defense: number
  speed: number
}

export interface FareMon {
  id: string
  name: string
  primaryType: FareMonType
  secondaryType?: FareMonType | null
  maxHP: number
  currentHP: number
  attack: number
  defense: number
  speed: number
  /** Base accuracy used by UI; battle hit formula still uses move accuracy + stages */
  accuracy?: number
  /** Base evasion used by UI */
  evasion?: number
  farePressure: number
  /** Short playstyle label from generation */
  playstyle?: string
  dpsProfile?: DpsProfile
  /** Shared identity text for matching front/back sprites */
  visualIdentity?: string
  characterPromptFront?: string
  characterPromptBack?: string
  /** Generated sprite URLs (data URLs or CDN); same for both clients in a match */
  frontImageUrl?: string | null
  backImageUrl?: string | null
  /** Legacy combined prompt */
  imagePrompt: string
  moves: FareMonMove[]
  attackStage: number
  defenseStage: number
  speedStage: number
  accuracyStage: number
  evasionStage: number
  majorStatus: MajorStatus | null
  sleepTurnsRemaining: number
  /** Turns remaining with shield damage reduction */
  shieldTurnsRemaining: number
  /** Damage applied to this FareMon at start of turn (setup) */
  pendingSetupDamage: number
}

export interface FareMonTeam {
  faremon1: FareMon | null
  faremon2: FareMon | null
  activeFareMonIndex: 0 | 1
  selectedTypes: FareMonType[]
  locked: boolean
}

export interface GeneratedFareMonImageSet {
  faremonId: string
  visualIdentity: string
  frontPrompt: string
  backPrompt: string
  frontImageUrl: string
  backImageUrl: string
}

export interface FareMonGeneratedImages {
  backgroundImageUrl: string
  backgroundPrompt: string
  player1: GeneratedFareMonImageSet
  player2: GeneratedFareMonImageSet
}

export type PlayerActionKind = 'move' | 'switch'

export interface FareMonBattleState {
  phase: 'type-selection' | 'generating' | 'battle' | 'result'
  player1Team: FareMonTeam
  player2Team: FareMonTeam
  player1SelectedMove: FareMonMove | null
  player2SelectedMove: FareMonMove | null
  player1Action: PlayerActionKind | null
  player2Action: PlayerActionKind | null
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
  generatedImages?: FareMonGeneratedImages | null
  imageGenerationStarted?: boolean
  imageGenerationCompleted?: boolean
  imageGenerationError?: string | null
}
