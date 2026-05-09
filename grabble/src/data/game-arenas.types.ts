/** Runtime arena records for game UI / battles (distinct from prompt-library arenas.json). */

export type GameArenaMood =
  | "intense"
  | "calm"
  | "chaotic"
  | "stylish"

export interface GameArena {
  id: string
  name: string
  imageFile: string
  description: string
  mood: GameArenaMood
  promptTemplate: string
}

export type GameArenasFile = GameArena[]
