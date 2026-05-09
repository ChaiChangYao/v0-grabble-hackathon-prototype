import { getFareMon } from "@/grabble/src/data"

/** PNGs live in `public/grabble/creatures/` (served at `/grabble/creatures/...`). */
export const CREATURE_IMAGE_PUBLIC_DIR = "/grabble/creatures"

export function getCreatureImageUrl(imageFile: string): string {
  const safe = imageFile.replace(/^\//, "")
  return `${CREATURE_IMAGE_PUBLIC_DIR}/${encodeURIComponent(safe)}`
}

/** Map in-battle display names from `grabble-types` creatures to dataset ids. */
export const creatureDisplayNameToId: Record<string, string> = {
  "Surge Serpent": "surge-serpent",
  "Terminal Tiger": "terminal-tiger",
}

/** URL for a creature’s `imageFile`, or `null` if unknown name. */
/** Arena JPEG/PNG under `public/grabble/arenas/` → `/grabble/arenas/...` */
export const ARENA_IMAGE_PUBLIC_DIR = "/grabble/arenas"

export function getArenaImageUrl(imageFile: string): string {
  const safe = imageFile.replace(/^\//, "")
  return `${ARENA_IMAGE_PUBLIC_DIR}/${encodeURIComponent(safe)}`
}
