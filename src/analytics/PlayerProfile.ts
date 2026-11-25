import { emptyMetrics, summarize, type SessionMetrics } from './MetricsCalculator.ts'
import { emptyModel } from '../intelligence/MarkovModel.ts'
import type { Model } from '../intelligence/MarkovModel'

export type Mode = 'adaptive' | 'standard'
export interface ExperimentResult {
  levelId: string
  stage: number
  size: number
  difficulty: number
  mode: Mode
  reason: string
  metrics: SessionMetrics
}

export interface Profile {
  version: 1
  completed: number
  unlockedStage: number
  totals: SessionMetrics
  history: ExperimentResult[]
  model: Model
  difficulty: number
  learningMoves: number
  learningRevisits: number
  personalBests: Record<string, number>
  achievements: string[]
  settings: { mode: Mode; mute: boolean; reducedMotion: boolean }
}

export function freshProfile(): Profile {
  return {
    version: 1, completed: 0, unlockedStage: 0, totals: emptyMetrics(), history: [], model: emptyModel(),
    difficulty: 1, learningMoves: 0, learningRevisits: 0, personalBests: {}, achievements: [],
    settings: { mode: 'adaptive', mute: true, reducedMotion: false },
  }
}

export function addResult(profile: Profile, result: ExperimentResult, model: Model, difficulty: number): Profile {
  const totals = structuredClone(profile.totals)
  for (const key of Object.keys(totals) as (keyof SessionMetrics)[]) {
    if (key === 'directions') {
      for (const direction of Object.keys(totals.directions) as (keyof SessionMetrics['directions'])[]) {
        totals.directions[direction] += result.metrics.directions[direction]
      }
    } else {
      totals[key] += result.metrics[key]
    }
  }
  const bestKey = `${result.mode}:${result.size}`
  const previousBest = profile.personalBests[bestKey] ?? Infinity
  const achievements = new Set(profile.achievements)
  achievements.add('First experiment completed')
  if (!result.metrics.collisions) achievements.add('Collision-free experiment')
  if (result.metrics.moves === result.metrics.optimalMoves && !result.metrics.hints) achievements.add('Optimal route without hints')
  if (result.stage === 4) achievements.add('Amaze stage completed')
  const relevantEvidence = [0, 3, 6, 8][result.stage] ?? 0
  const efficient = summarize(result.metrics).efficiency >= 0.75
  const replayed = profile.history.some((run) => run.stage === result.stage)
  const canAdvance = result.stage === profile.unlockedStage && result.stage < 4 &&
    (totals.junctions >= relevantEvidence || efficient || replayed)

  return {
    ...profile, unlockedStage: profile.unlockedStage + Number(canAdvance), completed: profile.completed + 1, totals, model, difficulty,
    learningMoves: profile.learningMoves + result.metrics.moves,
    learningRevisits: profile.learningRevisits + result.metrics.revisits,
    history: [...profile.history, result].slice(-24),
    personalBests: { ...profile.personalBests, [bestKey]: Math.min(previousBest, result.metrics.durationMs) },
    achievements: [...achievements],
  }
}
