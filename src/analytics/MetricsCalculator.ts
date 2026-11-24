import type { SessionMetrics } from './SessionAnalyzer'
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
