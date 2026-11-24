import type { Position } from '../types/Position'

export interface MazeLayout {
  grid: number[][]
  start: Position
  exit: Position
  seed: number
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), state | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const steps = [[0, -2], [2, 0], [0, 2], [-2, 0]]

export function generateMaze(width: number, height: number, seed: number): MazeLayout {
  if (![width, height].every((size) => Number.isInteger(size) && size >= 5 && size <= 101 && size % 2 === 1)) {
    throw new RangeError('Maze dimensions must be odd integers from 5 through 101.')
  }
  if (!Number.isSafeInteger(seed)) throw new RangeError('Maze seed must be a safe integer.')

  const random = seededRandom(seed)
  const grid = Array.from({ length: height }, () => Array<number>(width).fill(1))
  const start = { x: 1, y: 1 }
  const exit = { x: width - 2, y: height - 2 }
  const stack = [start]
  grid[start.y][start.x] = 0

  while (stack.length > 0) {
    const { x, y } = stack[stack.length - 1]
    const options = steps.map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .filter((next) => next.x > 0 && next.y > 0 && next.x < width - 1 && next.y < height - 1 &&
        grid[next.y][next.x] === 1)
    if (options.length === 0) {
      stack.pop()
      continue
    }

    const next = options[Math.floor(random() * options.length)]
    grid[(next.y + y) / 2][(next.x + x) / 2] = 0
    grid[next.y][next.x] = 0
    stack.push(next)
  }

  return { grid, start, exit, seed }
}
