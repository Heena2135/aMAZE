import { EventTracker } from './EventTracker.ts'
import { openNeighbors } from '../algorithms/PathFinder.ts'
import type { Grid } from '../algorithms/PathFinder'
import { predict, relativeTurn } from '../intelligence/MarkovModel.ts'
import type { Model, Turn } from '../intelligence/MarkovModel'
import type { Direction } from '../types/Direction'
import type { Position } from '../types/Position'

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

const cellKey = ({ x, y }: Position) => `${x},${y}`

export class SessionAnalyzer {
  private readonly grid: Grid
  private readonly metrics: SessionMetrics
  private readonly tracker: EventTracker
  private readonly visited: Set<string>
  private readonly model: Model
  private heading: Direction | undefined
  private previousCell: string | undefined
  private previousDecision: Turn | 'initial' = 'initial'
  private activeSince: number | null = null
  private lastAction = 0
  private deadEndEnteredAt: number | null = null
  private pausedAt: number | null = null

  constructor(grid: Grid, start: Position, optimum: number, model: Model, sessionId: string, levelId: string) {
    this.grid = grid
    this.metrics = emptyMetrics(optimum)
    this.tracker = new EventTracker(sessionId, levelId)
    this.visited = new Set([cellKey(start)])
    this.model = structuredClone(model)
  }

  resume(now: number): void {
    if (this.pausedAt !== null && this.deadEndEnteredAt !== null) {
      this.deadEndEnteredAt += now - this.pausedAt
    }
    this.pausedAt = null
    this.activeSince = now
    this.lastAction = now
  }

  private recordIdle(now: number): void {
    const elapsed = now - this.lastAction
    if (elapsed >= 15_000) {
      this.tracker.record({ type: 'idle', durationMs: elapsed }, now)
      this.metrics.idleMs += elapsed
    }
    this.lastAction = now
  }

  pause(now: number): void {
    if (this.activeSince === null) return
    this.recordIdle(now)
    this.metrics.durationMs += now - this.activeSince
    this.activeSince = null
    this.pausedAt = now
  }

  hint(now: number): void {
    this.recordIdle(now)
    this.metrics.hints++
    this.tracker.record({ type: 'hint', durationMs: 0 }, now)
  }

  movement(from: Position, direction: Direction, to: Position, success: boolean, now: number) {
    const decisionMs = now - this.lastAction
    this.recordIdle(now)
    const key = cellKey(to)
    const neighbors = openNeighbors(this.grid, from)
    const junction = neighbors.length >= 3
    const revisit = success && this.visited.has(key)
    const backtrack = success && this.previousCell === key
    const changedDirection = success && this.heading !== undefined && this.heading !== direction
    const deadEnd = success && openNeighbors(this.grid, to).length === 1
    this.tracker.record({
      type: 'movement', from, direction, to, outcome: success ? 'success' : 'collision',
      junction, changedDirection, revisit, backtrack, deadEnd,
    }, now)

    if (!success) {
      this.metrics.collisions++
      return null
    }

    this.metrics.moves++
    this.metrics.directions[direction]++
    if (revisit) this.metrics.revisits++
    if (backtrack) this.metrics.backtracks++
    if (changedDirection) this.metrics.directionChanges++
    if (this.deadEndEnteredAt !== null) {
      this.metrics.deadEndRecoveries++
      this.metrics.deadEndRecoveryMs += now - this.deadEndEnteredAt
    }
    this.deadEndEnteredAt = deadEnd ? now : null
    if (deadEnd) this.metrics.deadEnds++
    this.previousCell = cellKey(from)
    this.visited.add(key)

    let correct = null
    const heading = this.heading
    if (junction && heading) {
      this.metrics.junctions++
      if (decisionMs < 15_000) {
        this.metrics.decisionMs += decisionMs
        this.metrics.decisionSamples++
      }
      const choice = relativeTurn(heading, direction)
      const options = neighbors.map((neighbor) => relativeTurn(heading, neighbor.direction))
      const prediction = predict(this.model, this.previousDecision, options)
      if (prediction.choice) {
        correct = prediction.choice === choice
        this.metrics.predictions++
        this.metrics.correct += Number(correct)
        this.metrics.predictionsConfidence += prediction.confidence
      }
      this.model[this.previousDecision][choice]++
      this.previousDecision = choice
    }
    this.heading = direction
    return correct
  }

  complete(now: number) {
    this.pause(now)
    this.tracker.record({ type: 'session', durationMs: this.metrics.durationMs }, now)
    this.tracker.record({ type: 'complete', durationMs: this.metrics.durationMs }, now)
    return { metrics: structuredClone(this.metrics), model: structuredClone(this.model) }
  }

  getEvents() {
    return this.tracker.snapshot()
  }
}
