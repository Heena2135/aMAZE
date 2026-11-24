import type { GameStatus } from './GameStatus'
import type { Position } from './Position'

export interface GameSnapshot {
  readonly grid: readonly (readonly number[])[]
  readonly playerPosition: Readonly<Position>
  readonly exitPosition: Readonly<Position>
  readonly moveCount: number
  readonly collisionCount: number
  readonly status: GameStatus
}
