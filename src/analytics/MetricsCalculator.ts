import type { Direction } from '../types/Direction'

export interface SessionMetrics {
  moves: number
  collisions: number
  revisits: number
  backtracks: number
  directionChanges: number
  deadEnds: number
  deadEndRecoveries: number
  deadEndRecoveryMs: number
  junctions: number
  hints: number
  idleMs: number
  durationMs: number
  decisionMs: number
  decisionSamples: number
  predictions: number
  correct: number
  predictionsConfidence: number
  directions: Record<Direction, number>
  optimalMoves: number
}

export function emptyMetrics(optimalMoves = 0): SessionMetrics {
  return {
    moves: 0, collisions: 0, revisits: 0, backtracks: 0, directionChanges: 0,
    deadEnds: 0, deadEndRecoveries: 0, deadEndRecoveryMs: 0, junctions: 0, hints: 0, idleMs: 0, durationMs: 0, decisionMs: 0,
    decisionSamples: 0, predictions: 0, correct: 0, predictionsConfidence: 0,
    directions: { up: 0, down: 0, left: 0, right: 0 }, optimalMoves,
  }
}

const ratio = (amount: number, total: number) => total > 0 ? amount / total : 0

export function summarize(metrics: SessionMetrics) {
  return {
    collisionRate: ratio(metrics.collisions, metrics.moves + metrics.collisions),
    revisitationRate: ratio(metrics.revisits, metrics.moves),
    backtrackingRate: ratio(metrics.backtracks, metrics.moves),
    efficiency: ratio(metrics.optimalMoves, metrics.moves),
    averageDecisionMs: ratio(metrics.decisionMs, metrics.decisionSamples),
    accuracy: ratio(metrics.correct, metrics.predictions),
    meanConfidence: ratio(metrics.predictionsConfidence, metrics.predictions),
  }
}
