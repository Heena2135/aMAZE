import type { Direction } from '../types/Direction'

const directions = { up: '↑', left: '←', down: '↓', right: '→' } as const

export function GameControls({ onMove }: { onMove: (direction: Direction) => void }) {
  return (
    <div className="direction-pad" role="group" aria-label="Movement">
      {(Object.keys(directions) as Direction[]).map((direction) => (
        <button key={direction} className={`direction-${direction}`} type="button"
          aria-label={`Move ${direction}`} onClick={() => onMove(direction)}>
          {directions[direction]}
        </button>
      ))}
    </div>
  )
}
