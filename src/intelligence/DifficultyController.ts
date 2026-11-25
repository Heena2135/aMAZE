import { summarize } from '../analytics/MetricsCalculator.ts'
import type { SessionMetrics } from '../analytics/MetricsCalculator'

export function nextDifficulty(current: number, metrics: SessionMetrics, completed: number): number {
  if (completed < 2) return current
  const { collisionRate, efficiency } = summarize(metrics)
  const adjustment = collisionRate > 0.24 || efficiency < 0.56 ? -0.5
    : collisionRate < 0.1 && efficiency > 0.82 && metrics.hints === 0 ? 0.5 : 0
  return Math.max(0, Math.min(4, current + adjustment))
}
