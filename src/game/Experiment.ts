import { addResult } from '../analytics/PlayerProfile.ts'
import type { ExperimentResult, Profile } from '../analytics/PlayerProfile'
import { SessionAnalyzer } from '../analytics/SessionAnalyzer.ts'
import { summarize } from '../analytics/MetricsCalculator.ts'
import { findPaths } from '../algorithms/PathFinder.ts'
import { DialogueEngine } from '../companion/DialogueEngine.ts'
import { nextDifficulty } from '../intelligence/DifficultyController.ts'
import type { Direction } from '../types/Direction'
import type { Position } from '../types/Position'
import { GameEngine } from '../engine/GameEngine.ts'
import { Maze } from '../engine/Maze.ts'
import type { Level } from './LevelManager'

const EFFICIENT_REACTION_INTERVAL = 8
const REPEATED_COLLISIONS = 3
const IMPROVEMENT_MARGIN = 0.15

export class Experiment {
  readonly level: Level
  private readonly engine: GameEngine
  private readonly dialogue = new DialogueEngine()
  private session: SessionAnalyzer
  private runNumber = 0
  private hintCell: Position | undefined
  private creditRecorded = false
  private result: ExperimentResult | undefined
  private collisionStreak = 0

  constructor(level: Level, profile: Profile) {
    this.level = level
    this.engine = new GameEngine(new Maze(level.grid), level.start, level.exit)
    this.session = this.newSession(profile)
  }

  private newSession(profile: Profile) {
    const { grid, start, topology, id } = this.level
    return new SessionAnalyzer(grid, start, topology.shortestPath ?? 0, profile.model, `${id}:${++this.runNumber}`, id)
  }

  get message() { return this.dialogue.message }

  get status() {
    return this.engine.getStatus()
  }

  start(now: number) {
    const previous = this.engine.getStatus()
    this.engine.start()
    if (previous !== this.engine.getStatus()) {
      this.session.resume(now)
      this.dialogue.react('playing', now)
    }
  }

  pause(now: number) {
    if (this.engine.getStatus() !== 'playing') return
    this.engine.pause()
    this.session.pause(now)
    this.dialogue.react('paused', now)
  }

  reset(profile: Profile, now: number) {
    this.engine.reset()
    this.session = this.newSession(profile)
    this.result = undefined
    this.hintCell = undefined
    this.collisionStreak = 0
    this.dialogue.react('ready', now)
  }

  hint(now: number) {
    if (this.engine.getStatus() !== 'playing') return
    const cell = findPaths(this.level.grid, this.engine.getPlayerPosition(), this.level.exit).route[1]
    if (!cell || this.hintCell) return
    this.hintCell = cell
    this.session.hint(now)
    this.dialogue.react('hint', now)
  }

  move(direction: Direction, profile: Profile, now: number) {
    if (this.engine.getStatus() !== 'playing') return { moved: false, profile }
    const from = this.engine.getPlayerPosition()
    const moved = this.engine.move(direction)
    const to = this.engine.getPlayerPosition()
    const predictionCorrect = this.session.movement(from, direction, to, moved, now)
    if (moved) this.hintCell = undefined
    this.collisionStreak = moved ? 0 : this.collisionStreak + 1

    if (this.engine.getStatus() === 'won') {
      const { metrics, model } = this.session.complete(now)
      const { id: levelId, stage, size, mode, reason, difficulty } = this.level
      this.result = { levelId, stage, size, mode, reason, difficulty, metrics }
      const previous = profile.history.at(-1)
      const improved = previous && summarize(metrics).efficiency - summarize(previous.metrics).efficiency > IMPROVEMENT_MARGIN
      this.dialogue.react(improved ? 'improved' : 'won', now)
      if (!this.creditRecorded) {
        const difficulty = mode === 'adaptive' ? nextDifficulty(profile.difficulty, metrics, profile.completed + 1) : profile.difficulty
        profile = addResult(profile, this.result, model, difficulty)
        this.creditRecorded = true
      }
    } else {
      const { moveCount, collisionCount } = this.engine.getMoveCounts()
      const efficient = moved && moveCount >= EFFICIENT_REACTION_INTERVAL && moveCount % EFFICIENT_REACTION_INTERVAL === 0 && collisionCount === 0
        && this.level.topology.route[moveCount]?.x === to.x
        && this.level.topology.route[moveCount]?.y === to.y
      this.dialogue.react(!moved ? (this.collisionStreak >= REPEATED_COLLISIONS ? 'repeated' : 'collision')
        : predictionCorrect === false ? 'unexpected' : efficient ? 'efficient' : 'playing', now)
    }
    return { moved, profile }
  }

  view() {
    return {
      snapshot: this.engine.getSnapshot(),
      hintCell: this.hintCell ? { ...this.hintCell } : undefined,
      message: this.dialogue.message,
      signal: this.dialogue.signal,
      result: this.result,
    }
  }
}
