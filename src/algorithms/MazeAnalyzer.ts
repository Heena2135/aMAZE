import { findPaths, openNeighbors } from './PathFinder.ts'
import type { Grid } from './PathFinder'
import type { Position } from '../types/Position'

export function routeDirection(from: Position, to: Position) {
  if (to.x > from.x) return 'right'
  if (to.x < from.x) return 'left'
  return to.y > from.y ? 'down' : 'up'
}

export function analyzeMaze(grid: Grid, start: Position, exit: Position) {
  const { route, reachableArea } = findPaths(grid, start, exit)
  let deadEnds = 0
  let junctions = 0
  let branchingOpportunities = 0
  let corridorCells = 0
  let corridorLength = 0
  let longestCorridor = 0
  let corridorCount = 0
  const width = grid[0]?.length ?? 0
  const index = ({ x, y }: Position) => y * width + x
  const edge = (from: Position, to: Position) => {
    const a = index(from)
    const b = index(to)
    return a < b ? `${a}:${b}` : `${b}:${a}`
  }
  const traversed = new Set<string>()
  const corridorStarts: Position[] = []
  const corridorInteriors: Position[] = []
  for (const [y, row] of grid.entries()) {
    for (const [x, value] of row.entries()) {
      if (value !== 0) continue
      const degree = openNeighbors(grid, { x, y }).length
      if (degree === 1) deadEnds++
      if (degree === 2) {
        corridorCells++
        corridorInteriors.push({ x, y })
      } else {
        corridorStarts.push({ x, y })
      }
      if (degree >= 3) {
        junctions++
        branchingOpportunities += degree - 2
      }
    }
  }

  for (const startCell of [...corridorStarts, ...corridorInteriors]) {
    for (const next of openNeighbors(grid, startCell)) {
      if (traversed.has(edge(startCell, next))) continue
      let previous = startCell
      let current: Position = next
      let length = 0
      while (true) {
        const key = edge(previous, current)
        if (traversed.has(key)) break
        traversed.add(key)
        length++
        const adjacent = openNeighbors(grid, current)
        if (adjacent.length !== 2) break
        const forward = adjacent.find((cell) => index(cell) !== index(previous))!
        previous = current
        current = forward
      }
      corridorCount++
      corridorLength += length
      longestCorridor = Math.max(longestCorridor, length)
    }
  }

  let turns = 0
  let longestStraight = 0
  let straight = 0
  let previous = ''
  for (let i = 1; i < route.length; i++) {
    const direction = routeDirection(route[i - 1], route[i])
    if (previous && direction !== previous) turns++
    straight = direction === previous ? straight + 1 : 1
    longestStraight = Math.max(longestStraight, straight)
    previous = direction
  }

  return {
    route, reachableArea, deadEnds, junctions, branchingOpportunities, corridorCells,
    longestCorridor, meanCorridorLength: corridorCount ? corridorLength / corridorCount : 0,
    longestStraight, turns, shortestPath: route.length ? route.length - 1 : null,
  }
}
