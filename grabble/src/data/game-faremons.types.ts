/** Runtime battle / UI creature records (game logic), distinct from prompt-library faremons.json */

export type GameFaremonMoveEffect =
  | "none"
  | "shield"
  | "debuff"
  | "risky"

export interface GameFaremonMove {
  id: string
  name: string
  damage: number
  effect: GameFaremonMoveEffect
}

export interface GameFaremon {
  id: string
  name: string
  type: string
  hp: number
  imageFile: string
  description: string
  moves: GameFaremonMove[]
  promptTemplate: string
}

export type GameFaremonsFile = GameFaremon[]
