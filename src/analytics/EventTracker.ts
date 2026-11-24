import { DIRECTION_OFFSETS } from '../types/Direction.ts'
import type { Direction } from '../types/Direction'
import type { Position } from '../types/Position'

interface Movement {
  type: 'movement'
  from: Position
  direction: Direction
  to: Position
  outcome: 'success' | 'collision'
  junction: boolean
  changedDirection: boolean
  revisit: boolean
  backtrack: boolean
  deadEnd: boolean
}
type EventDetails = Movement | { type: 'hint' | 'complete' | 'idle' | 'session'; durationMs: number }
export type GameEvent = Readonly<EventDetails & {
  id: string
  sessionId: string
  levelId: string
  sequence: number
  timestamp: number
}>

export function validEvent(details: EventDetails): boolean {
  if (details.type !== 'movement') {
    return Number.isFinite(details.durationMs) && details.durationMs >= 0
  }
  const offset = DIRECTION_OFFSETS[details.direction]
  if (!offset || ![details.from.x, details.from.y, details.to.x, details.to.y]
    .every((value) => Number.isInteger(value) && value >= 0)) return false

  const dx = details.to.x - details.from.x
  const dy = details.to.y - details.from.y
  if (details.outcome === 'collision') return dx === 0 && dy === 0
  return details.outcome === 'success' && dx === offset.x && dy === offset.y
}

export class EventTracker {
  private sequence = 0
  private events: GameEvent[] = []
  private cursor = 0

  private readonly sessionId: string
  private readonly levelId: string
  private readonly capacity: number

  constructor(sessionId: string, levelId: string, capacity = 256) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('Event capacity must be positive.')
    this.sessionId = sessionId
    this.levelId = levelId
    this.capacity = capacity
  }

  record(details: EventDetails, timestamp: number): void {
    if (!validEvent(details) || !Number.isFinite(timestamp) || timestamp < 0) {
      throw new Error('Invalid gameplay event.')
    }
    const sequence = ++this.sequence
    const payload = details.type === 'movement'
      ? { ...details, from: { ...details.from }, to: { ...details.to } }
      : details
    this.events[this.cursor] = {
      ...payload, id: `${this.sessionId}:${sequence}`,
      sessionId: this.sessionId, levelId: this.levelId, sequence, timestamp,
    }
    this.cursor = (this.cursor + 1) % this.capacity
  }

  snapshot(): readonly GameEvent[] {
    const oldest = this.events.length === this.capacity ? this.cursor : 0
    return [...this.events.slice(oldest), ...this.events.slice(0, oldest)].map((event) =>
      event.type === 'movement' ? { ...event, from: { ...event.from }, to: { ...event.to } } : { ...event },
    )
  }
}
