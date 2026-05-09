import {
  faremons,
  getCommentaryLine,
  getFareMon,
  getRandomArena,
  type Arena,
  type FareMon,
  type Move,
} from "./data"

export type MatchPhase = "selection" | "battle" | "result"

export type MatchGameState = {
  player1Creature: FareMon
  player2Creature: FareMon
  player1CurrentHp: number
  player2CurrentHp: number
  arena: Arena
  commentary: string
  turn: number
  phase: MatchPhase
}

function findMove(creature: FareMon, moveId: string): Move | undefined {
  return creature.moves.find((m) => m.id === moveId)
}

/** Assign creatures and arena at match start (game / mode selection screen). */
export const initGameState = (): MatchGameState => {
  const player1Creature = getFareMon("surge-serpent")
  const player2Creature = getFareMon("terminal-tiger")
  return {
    player1Creature,
    player2Creature,
    player1CurrentHp: player1Creature.hp,
    player2CurrentHp: player2Creature.hp,
    arena: getRandomArena(),
    commentary: getCommentaryLine("gameSelection"),
    turn: 1,
    phase: "selection",
  }
}

export type ResolveTurnInput = Pick<
  MatchGameState,
  | "player1Creature"
  | "player2Creature"
  | "player1CurrentHp"
  | "player2CurrentHp"
  | "turn"
>

export type ResolveTurnResult = {
  commentary: string
  player1CurrentHp: number
  player2CurrentHp: number
  turn: number
}

/** After each pair of moves: apply both damages, advance turn, pick battle line for P1's move. */
export const resolveTurn = (
  state: ResolveTurnInput,
  p1Move: string,
  p2Move: string
): ResolveTurnResult => {
  const m1 = findMove(state.player1Creature, p1Move)
  const m2 = findMove(state.player2Creature, p2Move)
  let p1Hp = state.player1CurrentHp
  let p2Hp = state.player2CurrentHp
  if (m1) p2Hp = Math.max(0, p2Hp - m1.damage)
  if (m2) p1Hp = Math.max(0, p1Hp - m2.damage)
  return {
    commentary: getCommentaryLine("battle", p1Move),
    player1CurrentHp: p1Hp,
    player2CurrentHp: p2Hp,
    turn: state.turn + 1,
  }
}

export { faremons }
