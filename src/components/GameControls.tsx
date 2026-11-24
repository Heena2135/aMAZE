import type { Direction } from '../types/Direction'
import type { GameStatus } from '../types/GameStatus'

interface GameControlsProps {
  status: GameStatus
  onStart: () => void
  onPause: () => void
  onMove: (direction: Direction) => void
  onHint: () => void
  onReset: () => void
}

const arrows = { up: '↑', left: '←', down: '↓', right: '→' } satisfies Record<Direction, string>
const directions: Direction[] = ['up', 'left', 'down', 'right']

export function GameControls({ status, onStart, onPause, onMove, onHint, onReset }: GameControlsProps) {
  return (
    <section className="controls panel" aria-labelledby="controls-heading">
      <h2 id="controls-heading">Controls</h2>
      <p>Use the arrow keys, <kbd>WASD</kbd>, or the buttons below.</p>
      <div className="direction-pad" role="group" aria-label="Movement">
        {directions.map((direction) => (
          <button
            key={direction}
            className={`direction direction-${direction}`}
            type="button"
            disabled={status !== 'playing'}
            aria-label={`Move ${direction}`}
            onClick={() => onMove(direction)}
          >
            {arrows[direction]}
          </button>
        ))}
      </div>
      <div className="experiment-actions">
        <button className="begin-button" type="button" disabled={status === 'won'} onClick={status === 'playing' ? onPause : onStart}>
          {{ ready: 'Begin Experiment', playing: 'Pause Experiment', paused: 'Resume Experiment', won: 'Begin Experiment' }[status]}
        </button>
        <button type="button" onClick={onHint} disabled={status !== 'playing'}>Show one-step hint</button>
        <button type="button" onClick={onReset}>
          Restart Experiment
        </button>
      </div>
    </section>
  )
}
