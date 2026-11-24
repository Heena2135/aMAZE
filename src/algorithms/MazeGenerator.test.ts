import { expect, it } from 'vitest'
import { generateMaze } from './MazeGenerator.ts'
import { analyzeMaze } from './MazeAnalyzer.ts'
import { findPaths } from './PathFinder.ts'

it('generates deterministic, connected mazes across rectangular sizes and seeds', () => {
  const observed = new Set<string>()
  for (const [width, height] of [[5, 7], [13, 9], [31, 31], [101, 99]]) {
    for (const seed of [0, 1, 2026, 0xffffffff]) {
      const { grid, start, exit } = generateMaze(width, height, seed)
      expect(grid).toEqual(generateMaze(width, height, seed).grid)
      expect(grid[height - 1]).toEqual(Array(width).fill(1))
      const analysis = analyzeMaze(grid, start, exit)
      expect(analysis.reachableArea).toBe(grid.flat().filter((cell) => cell === 0).length)
      expect(analysis.shortestPath).toBeGreaterThan(0)
      if (width === 13) observed.add(JSON.stringify(grid))
    }
  }
  expect(observed.size).toBe(4)
  expect(() => generateMaze(6, 9, 0)).toThrow(/odd/)
  expect(() => generateMaze(7, Infinity, 0)).toThrow(/odd/)
})

it('finds a shortest route in a loopy graph and handles unreachable exits', () => {
  const grid = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]
  expect(findPaths(grid, { x: 0, y: 0 }, { x: 2, y: 0 }).route).toEqual([
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
  ])
  expect(findPaths([[0, 1, 0]], { x: 0, y: 0 }, { x: 2, y: 0 })).toEqual({ route: [], reachableArea: 1 })
})
