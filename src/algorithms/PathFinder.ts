import { DIRECTION_OFFSETS } from '../types/Direction.ts'
import type { Direction } from '../types/Direction'
import type { Position } from '../types/Position'

export type Grid = readonly (readonly number[])[]
const offsets = Object.entries(DIRECTION_OFFSETS) as [Direction, Position][]

export function openNeighbors(grid: Grid, { x, y }: Position) {
  return offsets.map(([direction, offset]) => ({ direction, x: x + offset.x, y: y + offset.y }))
    .filter((cell) => grid[cell.y]?.[cell.x] === 0)
}

export function findPaths(grid: Grid, start: Position, exit: Position) {
  const width = grid[0]?.length ?? 0
  const index = ({ x, y }: Position) => y * width + x
  const parent = new Int32Array(width * grid.length).fill(-1)
  const route: Position[] = []
  if (grid[start.y]?.[start.x] !== 0) return { route, reachableArea: 0 }

  const queue = [start]
  parent[index(start)] = index(start)

  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head]
    for (const next of openNeighbors(grid, cell)) {
      const key = index(next)
      if (parent[key] !== -1) continue
      parent[key] = index(cell)
      queue.push(next)
    }
  }

  if (grid[exit.y]?.[exit.x] === 0 && parent[index(exit)] !== -1) {
    let key = index(exit)
    while (key !== index(start)) {
      route.push({ x: key % width, y: Math.floor(key / width) })
      key = parent[key]
    }
    route.push({ ...start })
    route.reverse()
  }
  return { route, reachableArea: queue.length }
}
