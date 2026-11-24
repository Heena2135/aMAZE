import type { Position } from './Position'

export type Direction = 'up' | 'down' | 'left' | 'right'

export const DIRECTION_OFFSETS: Readonly<Record<Direction, Readonly<Position>>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
