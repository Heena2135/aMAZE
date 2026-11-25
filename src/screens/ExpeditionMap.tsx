import { stages } from '../game/LevelManager'

import { chamberNames } from '../assets/interface/chambers'

export function ExpeditionMap({ unlocked, current, onSelect }: { unlocked: number; current: number; onSelect: (stage: number) => void }) {
  return (
    <section className="journey" aria-labelledby="journey-title">
      <p className="eyebrow">VESSEL SCHEMATIC</p>
      <h1 id="journey-title">Experiment route</h1>
      <ol className="ship-route">
        {stages.map((stage, index) => (
          <li key={stage} data-chamber={index}>
            <button type="button" disabled={index > unlocked} aria-current={index === current ? 'step' : undefined}
              onClick={() => onSelect(index)}>
              <span className="chamber-symbol" aria-hidden="true">0{index + 1}</span>
              <span><strong>{stage}</strong><small>{chamberNames[index]}</small></span>
              {index > unlocked && <span className="lock-label">Locked</span>}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
