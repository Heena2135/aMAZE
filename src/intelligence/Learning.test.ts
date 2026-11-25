import { expect, it } from 'vitest'
import { EventTracker, validEvent } from '../analytics/EventTracker.ts'
import { SessionAnalyzer } from '../analytics/SessionAnalyzer.ts'
import { emptyMetrics } from '../analytics/MetricsCalculator.ts'
import { freshProfile } from '../analytics/PlayerProfile.ts'
import { summarize } from '../analytics/MetricsCalculator.ts'
import { decodeProfile, loadProfile, saveProfile } from '../storage/ProfileStorage.ts'
import { createLevel, stageFor } from '../game/LevelManager.ts'
import { emptyModel, predict, relativeTurn } from './MarkovModel.ts'
import { nextDifficulty } from './DifficultyController.ts'

it('validates event outcomes and retains a bounded ordered window', () => {
  const tracker = new EventTracker('session', 'level', 2)
  for (let i = 0; i < 5; i++) tracker.record({ type: 'hint', durationMs: 0 }, i)
  expect(tracker.snapshot().map((event) => event.sequence)).toEqual([4, 5])
  expect(() => tracker.record({ type: 'idle', durationMs: -1 }, 5)).toThrow()
  expect(validEvent({
    type: 'movement', from: { x: 0, y: 0 }, to: { x: 1, y: 0 },
    direction: 'left', outcome: 'success', revisit: false, backtrack: false, junction: false,
    deadEnd: false, changedDirection: false,
  })).toBe(false)
})

it('trains on junctions, measures behavior, and excludes paused time', () => {
  const start = { x: 0, y: 1 }
  const center = { x: 1, y: 1 }
  const analyzer = new SessionAnalyzer([[1, 0, 1], [0, 0, 0], [1, 1, 1]], start, 2, emptyModel(), 's', 'l')
  analyzer.resume(0)
  analyzer.movement(start, 'right', center, true, 1)
  analyzer.movement(center, 'down', center, false, 2)
  analyzer.pause(3)
  analyzer.resume(200)
  analyzer.movement(center, 'left', start, true, 201)
  analyzer.movement(start, 'right', center, true, 202)
  analyzer.movement(center, 'up', { x: 1, y: 0 }, true, 203)
  const { metrics, model } = analyzer.complete(205)
  expect(metrics).toMatchObject({ moves: 4, collisions: 1, junctions: 2, revisits: 2, backtracks: 2, durationMs: 8 })
  expect(summarize(metrics)).toMatchObject({ efficiency: 0.5, collisionRate: 0.2 })
  expect(model.initial.reverse).toBe(1)
  expect(model.reverse.left).toBe(1)
  expect(analyzer.getEvents().at(-1)?.type).toBe('complete')
})

it('uses smoothing, thresholds, and legal options for prediction', () => {
  const model = emptyModel()
  expect(predict(model, 'initial', ['left', 'right'])).toMatchObject({ choice: null, confidence: 0.5 })
  model.left.left = 20
  const forecast = predict(model, 'left', ['left', 'right'])
  expect(forecast.choice).toBe('left')
  expect(forecast.probabilities.left + forecast.probabilities.right).toBeCloseTo(1)
  expect(forecast.probabilities.right).toBeGreaterThan(0)
  expect(predict(model, 'left', ['straight', 'right']).choice).toBeNull()
  expect(relativeTurn('down', 'left')).toBe('right')
})

it('selects solvable deterministic levels, bounds difficulty, and permits standard play', () => {
  const profile = freshProfile()
  profile.completed = 4
  profile.unlockedStage = 4
  profile.totals.junctions = 8
  profile.model.left.left = 50
  expect(stageFor(profile)).toBe(4)
  const selected = createLevel(profile, 10)
  expect(selected).toEqual(createLevel(profile, 10))
  expect(selected.topology.shortestPath).toBeGreaterThan(0)
  expect(selected.reason).toMatch(/solvable layouts/)
  expect(createLevel(profile, 10, 4, 'standard').reason).toMatch(/standard layout/)
  expect(nextDifficulty(4, { ...emptyMetrics(20), moves: 20 }, 2)).toBe(4)
  expect(nextDifficulty(0, { ...emptyMetrics(20), moves: 20, collisions: 20 }, 2)).toBe(0)
})

it('validates stored profiles and handles corruption, oversize and storage errors', () => {
  const profile = freshProfile()
  expect(decodeProfile(JSON.stringify(profile))).toEqual(profile)
  for (const data of ['{', '{"version":2}', 'x'.repeat(70_000), JSON.stringify({ ...profile, difficulty: 5 })]) {
    expect(decodeProfile(data)).toEqual(profile)
  }
  expect(loadProfile({ getItem: () => { throw new Error('Blocked') } })).toEqual(profile)
  expect(saveProfile({ setItem: () => { throw new Error('Quota') } }, profile)).toBe(false)
})

it('can change the selected candidate in response to learned preferences and leaves standard mode independent', () => {
  const cold = freshProfile()
  const trained = freshProfile()
  for (const row of Object.values(trained.model)) row.left = 20

  const baseline = createLevel(cold, 3, 4)
  const personalized = createLevel(trained, 3, 4)
  expect(personalized.seed).not.toBe(baseline.seed)
  expect(personalized.reason).toMatch(/evaluated junctions/)
  expect(personalized.topology.route.at(-1)).toEqual(personalized.exit)
  expect(createLevel(trained, 3, 4, 'standard')).toEqual(createLevel(cold, 3, 4, 'standard'))
})

it('scores a confident prediction before updating it with a different decision', () => {
  const model = emptyModel()
  model.initial.left = 20
  const start = { x: 0, y: 1 }
  const center = { x: 1, y: 1 }
  const analyzer = new SessionAnalyzer([[1, 0, 1], [0, 0, 0], [1, 1, 1]], start, 2, model, 's', 'l')
  analyzer.resume(0)
  analyzer.movement(start, 'right', center, true, 1)
  expect(analyzer.movement(center, 'right', { x: 2, y: 1 }, true, 2)).toBe(false)
  const result = analyzer.complete(3)
  expect(result.metrics).toMatchObject({ predictions: 1, correct: 0 })
  expect(result.model.initial.straight).toBe(1)
  expect(model.initial.straight).toBe(0)
})

it('finds more Observation routes with genuine junctions without lengthening a route by more than six moves', async () => {
  const { openNeighbors } = await import('../algorithms/PathFinder.ts')
  const profile = freshProfile()
  const branches = (level: ReturnType<typeof createLevel>) => level.topology.route.slice(1, -1)
    .filter((position) => openNeighbors(level.grid, position).length >= 3).length
  let improved = 0
  for (let seed = 0; seed < 32; seed++) {
    const standard = createLevel(profile, seed, 1, 'standard')
    const adaptive = createLevel(profile, seed, 1, 'adaptive')
    expect(adaptive).toEqual(createLevel(profile, seed, 1, 'adaptive'))
    expect(adaptive.topology.route.at(-1)).toEqual(adaptive.exit)
    expect(adaptive.topology.route.length).toBeLessThanOrEqual(standard.topology.route.length + 6)
    expect(branches(adaptive)).toBeGreaterThanOrEqual(branches(standard) ? 1 : 0)
    improved += Number(branches(standard) === 0 && branches(adaptive) > 0)
  }
  expect(improved).toBeGreaterThan(0)
})
