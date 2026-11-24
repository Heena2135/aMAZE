import { describe, expect, it } from 'vitest'
import { GameEngine } from './GameEngine.ts'
import { Maze } from './Maze.ts'
import { Player } from './Player.ts'

describe('playable foundation', () => {
  it('validates maze coordinates and isolates supplied grids', () => {
    const grid = [[1, 1, 1], [1, 0, 1]]
    const maze = new Maze(grid)
    grid[1][1] = 1
    expect(maze.getWidth()).toBe(3)
    expect(maze.getHeight()).toBe(2)
    expect(maze.isWalkable({ x: 1, y: 1 })).toBe(true)
    for (const x of [-1, 1.5, NaN, Infinity, 3]) {
      expect(maze.isWall({ x, y: 1 })).toBe(true)
    }
    expect(() => new Maze([[0], [0, 1]])).toThrow(/rectangle/)
  })

  it('supports all four directions and isolates player state', () => {
    const start = { x: 1, y: 1 }
    const player = new Player(new Maze(), start)
    start.x = 0
    expect(player.move('up')).toBe(false)
    for (const direction of ['right', 'right', 'down', 'up', 'left'] as const) {
      expect(player.move(direction)).toBe(true)
    }
    player.getPosition().x = -1
    expect(player.getPosition()).toEqual({ x: 2, y: 1 })
    expect(player.getMoveCount()).toBe(5)
    expect(player.getCollisionCount()).toBe(1)
    player.reset()
    expect(player.getPosition()).toEqual({ x: 1, y: 1 })
    expect(player.getMoveCount()).toBe(0)
  })

  it('starts, pauses, resumes, wins, and resets', () => {
    const game = new GameEngine()
    const initial = game.getSnapshot()
    game.pause()
    expect(game.move('right')).toBe(false)
    game.start()
    expect(game.move('up')).toBe(false)
    expect(game.move('right')).toBe(true)
    game.pause()
    expect(game.getStatus()).toBe('paused')
    expect(game.move('right')).toBe(false)
    game.start()
    for (const step of ['right', 'down', 'down'] as const) expect(game.move(step)).toBe(true)
    game.start()
    expect(game.getStatus()).toBe('won')
    expect(game.move('up')).toBe(false)
    expect(game.getSnapshot()).toMatchObject({ moveCount: 4, collisionCount: 1 })
    expect(game.getSnapshot().grid).not.toBe(initial.grid)
    expect(game.getSnapshot().grid[0]).not.toBe(initial.grid[0])
    game.reset()
    expect(game.getSnapshot()).toEqual(initial)
    expect(() => new GameEngine(undefined, undefined, { x: 2, y: 2 })).toThrow(/walkable/)
  })
})
