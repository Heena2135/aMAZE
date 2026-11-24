import { DIRECTION_OFFSETS, type Direction } from '../types/Direction.ts'
import type { Position } from '../types/Position'
import type { Maze } from './Maze'

export class Player {
  private readonly maze: Maze
  private readonly initialPosition: Position
  private position: Position
  private moveCount = 0
  private collisionCount = 0

  constructor(maze: Maze, initialPosition: Position = { x: 1, y: 1 }) {
    if (!maze.isWalkable(initialPosition)) {
      throw new Error(
        `Cannot start player at (${initialPosition.x}, ${initialPosition.y}): the position must be walkable.`,
      )
    }

    this.maze = maze
    this.initialPosition = { ...initialPosition }
    this.position = { ...this.initialPosition }
  }

  public getPosition(): Position {
    return { ...this.position }
  }

  public getMoveCount(): number {
    return this.moveCount
  }

  public getCollisionCount(): number {
    return this.collisionCount
  }

  public move(direction: Direction): boolean {
    const offset = DIRECTION_OFFSETS[direction]
    const nextPosition = {
      x: this.position.x + offset.x,
      y: this.position.y + offset.y,
    }

    if (!this.maze.isWalkable(nextPosition)) {
      this.collisionCount++
      return false
    }

    this.position = nextPosition
    this.moveCount++
    return true
  }

  public reset(): void {
    this.position = { ...this.initialPosition }
    this.moveCount = 0
    this.collisionCount = 0
  }
}
