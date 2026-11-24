import { expect, it } from 'vitest'
import { routeDirection } from '../algorithms/MazeAnalyzer.ts'
import { addResult, freshProfile } from '../analytics/PlayerProfile.ts'
import { emptyMetrics } from '../analytics/SessionAnalyzer.ts'
import { createLevel } from './LevelManager.ts'
import { Experiment } from './Experiment.ts'

it('records completed sessions once and keeps hints and movement outside play inert', () => {
  let profile = freshProfile()
  const level = createLevel(profile, 2026)
  const experiment = new Experiment(level, profile)
  const route = level.topology.route
  let now = 0

  for (let run = 0; run < 2; run++) {
    experiment.hint(now)
    expect(experiment.view().hintCell).toBeUndefined()
    expect(experiment.move('up', profile, now).moved).toBe(false)
    experiment.start(now++)
    experiment.hint(now++)
    experiment.hint(now++)
    expect(experiment.view().hintCell).toEqual(route[1])
    experiment.pause(now++)
    expect(experiment.move('up', profile, now++).moved).toBe(false)
    experiment.start(now++)
    for (let i = 1; i < route.length; i++) {
      const result = experiment.move(routeDirection(route[i - 1], route[i]), profile, now++)
      expect(result.moved).toBe(true)
      profile = result.profile
    }
    expect(experiment.view().snapshot.status).toBe('won')
    expect(experiment.view().result?.metrics.hints).toBe(1)
    expect(experiment.view().result?.metrics.collisions).toBe(0)
    experiment.reset(profile, now++)
  }

  expect(profile.completed).toBe(1)
  expect(profile.unlockedStage).toBe(1)
})

it('allows advancement through all stages without letting replays of earlier stages skip locks', () => {
  let profile = freshProfile()
  const result = {
    levelId: 'seed',
    stage: 0, size: 7, difficulty: 1,
    mode: 'adaptive' as const, reason: 'Test fixture',
    metrics: { ...emptyMetrics(40), moves: 40 },
  }
  for (let i = 0; i < 6; i++) profile = addResult(profile, result, profile.model, 1)
  expect(profile.unlockedStage).toBe(1)

  for (const stage of [1, 2, 3, 4]) {
    profile = addResult(profile, { ...result, stage, size: 7 + stage * 2 }, profile.model, 1)
  }
  expect(profile.unlockedStage).toBe(4)
  expect(profile.achievements).toContain('Amaze stage completed')
})
