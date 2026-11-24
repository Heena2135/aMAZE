import type { Direction } from '../types/Direction'
import type { GameSnapshot } from '../types/GameSnapshot'
import type { GameStatus } from '../types/GameStatus'
import type { Position } from '../types/Position'
import { Maze } from './Maze.ts'
import { Player } from './Player.ts'

export class GameEngine {
  private readonly maze: Maze
  private readonly player: Player
  private readonly exitPosition: Position
  private status: GameStatus = 'ready'

  constructor(
    maze: Maze = new Maze(),
    startPosition: Position = { x: 1, y: 1 },
    exitPosition: Position = { x: 3, y: 3 },
  ) {
    if (!maze.isWalkable(exitPosition)) {
      throw new Error(
        `Cannot place exit at (${exitPosition.x}, ${exitPosition.y}): the position must be walkable.`,
      )
    }
    if (startPosition.x === exitPosition.x && startPosition.y === exitPosition.y) {
      throw new Error('Starting position and exit position must be distinct.')
    }

    this.maze = maze
    this.player = new Player(maze, startPosition)
    this.exitPosition = { ...exitPosition }
  }

  public start(): void {
    if (this.status === 'ready' || this.status === 'paused') {
      this.status = 'playing'
    }
  }

  public pause(): void {
    if (this.status === 'playing') this.status = 'paused'
  }

  public move(direction: Direction): boolean {
    if (this.status !== 'playing' || !this.player.move(direction)) {
      return false
    }

    const { x, y } = this.player.getPosition()
    if (x === this.exitPosition.x && y === this.exitPosition.y) {
      this.status = 'won'
    }

    return true
  }

  public reset(): void {
    this.player.reset()
    this.status = 'ready'
  }

  public getPlayerPosition(): Position {
    return this.player.getPosition()
  }

  public getStatus(): GameStatus {
    return this.status
  }

  public getSnapshot(): GameSnapshot {
    return {
      grid: this.maze.getGrid(),
      playerPosition: this.player.getPosition(),
      exitPosition: { ...this.exitPosition },
      moveCount: this.player.getMoveCount(),
      collisionCount: this.player.getCollisionCount(),
      status: this.status,
    }
  }
}
