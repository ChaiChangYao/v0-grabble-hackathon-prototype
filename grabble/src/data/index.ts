export type {
  ArenaPromptAsset,
  ArenasLibraryFile,
  CommentaryLibraryFile,
  FaremonPromptAsset,
  FaremonsLibraryFile,
  GrabblePromptCategory,
  GrabblePromptRecord,
  GrabblePromptRowType,
  UiBrandPromptAsset,
} from "./prompt-library.types"

export type {
  GameFaremon,
  GameFaremonMove,
  GameFaremonMoveEffect,
  GameFaremonsFile,
} from "./game-faremons.types"

export type {
  GameArena,
  GameArenaMood,
  GameArenasFile,
} from "./game-arenas.types"

import type {
  ArenasLibraryFile,
  CommentaryLibraryFile,
  FaremonsLibraryFile,
} from "./prompt-library.types"
import type { GameArenasFile } from "./game-arenas.types"
import type { GameFaremonsFile } from "./game-faremons.types"
import arenasJson from "./arenas.json"
import commentaryJson from "./commentary.json"
import faremonsJson from "./faremons.json"
import gameArenasJson from "./game-arenas.json"
import gameFaremonsJson from "./game-faremons.json"
import promptTemplatesJson from "./promptTemplates.json"

export const faremonsData = faremonsJson as FaremonsLibraryFile
export const arenasData = arenasJson as ArenasLibraryFile
export const commentaryData = commentaryJson as CommentaryLibraryFile
export const promptTemplatesData = promptTemplatesJson
export const gameFaremons = gameFaremonsJson as GameFaremonsFile
export const gameArenas = gameArenasJson as GameArenasFile

export type FaremonCreatureRecord = FaremonsLibraryFile["creatures"][number]
export type ArenaRecord = ArenasLibraryFile["arenas"][number]
export type CommentaryUiBrandAsset = CommentaryLibraryFile["uiBrandAssets"][number]

/** Single import: `import { grabbleData } from '@/grabble/src/data'` */
export const grabbleData = {
  faremons: faremonsData,
  arenas: arenasData,
  commentary: commentaryData,
  promptTemplates: promptTemplatesData,
  gameFaremons,
  gameArenas,
}

/** Runtime game data + helpers (`faremons` / `arenas` arrays, `getFareMon`, …) */
export * from "./grabble"
