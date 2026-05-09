import { getFareMon, getRandomArena } from "@/grabble/src/data"

/** Demo / fixture hooks for multiplayer flows — uses runtime `game-faremons` + `game-arenas` data. */
export function loadDemoFareMonPair() {
  return {
    player1: getFareMon("surge-serpent"),
    player2: getFareMon("terminal-tiger"),
  }
}

export function loadDemoArena() {
  return getRandomArena()
}
