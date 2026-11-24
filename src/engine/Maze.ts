import type { Position } from '../types/Position'

export class Maze {
  private readonly grid: number[][]

  constructor(grid: readonly (readonly number[])[] = [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
    ]) {
    const width = grid[0]?.length
    if (!width || !grid.every((row) => row.length === width && row.every((cell) => cell === 0 || cell === 1))) {
      throw new RangeError('Maze grid must be a nonempty rectangle of walls and paths.')
    }
    this.grid = grid.map((row) => [...row])
  }

  public getGrid(): number[][] {
    return this.grid.map((row) => [...row])
  }

  public getWidth(): number {
    return this.grid[0].length
  }

  public getHeight(): number {
    return this.grid.length
  }

  public isWithinBounds({ x, y }: Position): boolean {
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      x < this.getWidth() &&
      y >= 0 &&
      y < this.getHeight()
    )
  }

  public isWall(position: Position): boolean {
    return !this.isWalkable(position)
  }

  public isWalkable(position: Position): boolean {
    return this.isWithinBounds(position) && this.grid[position.y][position.x] === 0
  }
}
