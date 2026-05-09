import arenasJson from "./game-arenas.json"
import faremonsJson from "./game-faremons.json"
import commentaryJson from "./commentary-lines.json"
import prompts from "./promptTemplates.json"

export type Move = {
  id: string
  name: string
  damage: number
  effect: "none" | "shield" | "debuff" | "risky"
}

export type FareMon = {
  id: string
  name: string
  type: string
  hp: number
  imageFile: string
  description: string
  moves: Move[]
  promptTemplate: string
}

export type Arena = {
  id: string
  name: string
  imageFile: string
  description: string
  mood: string
  promptTemplate: string
}

/** Commentary bundle: lineup categories + `battle` keyed by move id. */
export type CommentaryData = {
  faremonBattle: string[]
  matchmaking: string[]
  neutral: string[]
  gameSelection: string[]
  battle: Record<string, string[]>
}

export const faremons = faremonsJson as FareMon[]
export const arenas = arenasJson as Arena[]
export const commentary = commentaryJson as CommentaryData
export { prompts }

export const getFareMon = (id: string): FareMon =>
  faremons.find((f) => f.id === id)!

export const getArena = (id: string): Arena =>
  arenas.find((a) => a.id === id)!

export const getRandomArena = (): Arena =>
  arenas[Math.floor(Math.random() * arenas.length)]!

export const getCommentaryLine = (
  category: keyof CommentaryData,
  moveId?: string
): string => {
  const c = commentary

  if (category === "battle") {
    const b = c.battle
    if (moveId) {
      const lines = b[moveId] ?? []
      return lines.length === 0
        ? ""
        : lines[Math.floor(Math.random() * lines.length)]!
    }
    const keys = Object.keys(b)
    if (keys.length === 0) return ""
    const k = keys[Math.floor(Math.random() * keys.length)]!
    const lines = b[k] ?? []
    return lines.length === 0
      ? ""
      : lines[Math.floor(Math.random() * lines.length)]!
  }

  const lines = c[category]
  if (!lines.length) return ""
  return lines[Math.floor(Math.random() * lines.length)]!
}
