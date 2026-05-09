import type { FareMonBattleState } from '@/lib/faremon/types'
import type { BattleRouteState } from '@/lib/battleroute-engine'

export type GrabbleRoomStatus =
  | 'waiting-for-player2'
  | 'ready'
  | 'selecting-game'
  | 'pregame'
  | 'faremon-type-selection'
  | 'faremon-generating'
  | 'faremon-generating-team'
  | 'faremon-generating-images'
  | 'faremon-battle'
  | 'battleroute-placement'
  | 'battleroute-attack'
  | 'result'

export interface GrabbleRoom {
  roomCode: string
  version: number
  updatedAt: number
  status: GrabbleRoomStatus
  player1Id: string | null
  player2Id: string | null
  player1Connected: boolean
  player2Connected: boolean
  disconnectedPlayer: 1 | 2 | null
  selectedGame: 'faremon' | 'battleship' | null
  faremonState: FareMonBattleState | null
  battleshipState: BattleRouteState | null
  faremonGenerationStarted: boolean
  /** When both teams have types picked and server is generating */
  faremonGenerating: boolean
  winner: 1 | 2 | null
  /** While true, only server should run resolveFareMonTurn */
  faremonResolvingTurn: boolean
}
