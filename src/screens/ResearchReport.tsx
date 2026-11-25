import { useState } from 'react'
import { ResearchExport } from '../components/ResearchExport'
import { summarize } from '../analytics/MetricsCalculator.ts'
import type { Profile } from '../analytics/PlayerProfile'
import { stages } from '../game/LevelManager.ts'
import { marginalCounts, turns } from '../intelligence/MarkovModel.ts'

import { seconds } from '../utils/formatTime'

const percent = (value: number) => `${Math.round(value * 100)}%`

interface Props {
  profile: Profile
  chamber: { stage: number; mode: Profile['settings']['mode']; reason: string }
}

export function ResearchReport({ profile, chamber }: Props) {
  const [historyMetric, setHistoryMetric] = useState<'efficiency' | 'collisionRate'>('efficiency')
  const { totals, history } = profile
  const metrics = summarize(totals)
  const counts = marginalCounts(profile.model)
  const totalChoices = turns.reduce((sum, key) => sum + counts[key], 0)
  const first = history[0]
  const last = history.at(-1)
  const frequentDirection = Object.entries(totals.directions).sort((a, b) => b[1] - a[1])[0]

  return (
    <section className="report journal" aria-labelledby="report-title">
      <p className="eyebrow">VEY’S FIELD NOTES</p>
      <h1 id="report-title">Research journal</h1>
      <ResearchExport profile={profile} />
      <div className="journal-body">
      <details className="journal-method">
        <summary>How this chamber was chosen</summary>
        <p><strong>{stages[chamber.stage]} · {chamber.mode}</strong></p>
        <p>{chamber.reason}</p>
        <p>Seeded depth-first search builds the layouts. Breadth-first search (BFS) verifies that the exit is reachable and finds the shortest route. Route efficiency compares that route with the moves you actually made.</p>
        <p>At junctions, the Markov model uses earlier choices to estimate possible turns. It skips predictions when evidence is sparse. Adaptive chambers can use confident predictions alongside route length and dead ends. Standard mode chooses independently of your profile.</p>
      </details>
      {profile.completed === 0 ? <p>Complete an experiment to collect your first observations.</p> : <>
        <h2>Measured navigation</h2>
        <dl className="report-metrics">
          <div><dt>Completed</dt><dd>{profile.completed}</dd></div>
          <div><dt>Route efficiency</dt><dd>{percent(metrics.efficiency)}</dd></div>
          <div><dt>Wall contacts</dt><dd>{totals.collisions} ({percent(metrics.collisionRate)} of attempts)</dd></div>
          <div><dt>Revisits</dt><dd>{percent(metrics.revisitationRate)}</dd></div>
          <div><dt>Backtracking</dt><dd>{percent(metrics.backtrackingRate)}</dd></div>
          <div><dt>Dead-end visits</dt><dd>{totals.deadEnds}</dd></div>
          {totals.deadEndRecoveries >= 3 && <div><dt>Avg. dead-end recovery</dt>
            <dd>{seconds(totals.deadEndRecoveryMs / totals.deadEndRecoveries)}</dd></div>}
          <div><dt>Idle time</dt><dd>{seconds(totals.idleMs)}</dd></div>
          {totals.decisionSamples >= 5 && <div><dt>Avg. junction decision</dt><dd>{seconds(metrics.averageDecisionMs)}</dd></div>}
          {totals.moves >= 12 && <div><dt>Most-used absolute direction</dt><dd>{frequentDirection[0]} ({frequentDirection[1]} moves)</dd></div>}
        </dl>
        <h2>Measured junction choices</h2>
        {totalChoices >= 8 ? <ul className="turn-distribution">
          {turns.map((turn) => <li key={turn}>
            <span>{turn}</span><meter min="0" max="1" value={counts[turn] / totalChoices} aria-label={turn} />
            <strong>{percent(counts[turn] / totalChoices)}</strong>
          </li>)}
        </ul> : <p>{totalChoices} recorded choices since the last learning reset. Turn preferences appear after eight.</p>}
        <h2>Prediction evaluation</h2>
        {totals.predictions >= 5 ? <p>
          Across all completed experiments, predictions were correct for {totals.correct} of {totals.predictions} evaluated decisions
          ({percent(metrics.accuracy)}). Mean model confidence was {percent(metrics.meanConfidence)}.
        </p> : <p>{totals.predictions} predictions evaluated. Accuracy appears after five.</p>}
        {first && last && first !== last && <p>
          Route efficiency across retained experiments went from {percent(summarize(first.metrics).efficiency)}
          {' '}to {percent(summarize(last.metrics).efficiency)} on different layouts.
        </p>}
        <h2>Compare experiments</h2>
        <div className="action-row" role="group" aria-label="Metric to compare">
          <button type="button" aria-pressed={historyMetric === 'efficiency'} onClick={() => setHistoryMetric('efficiency')}>Route efficiency</button>
          <button type="button" aria-pressed={historyMetric === 'collisionRate'} onClick={() => setHistoryMetric('collisionRate')}>Collision rate</button>
        </div>
        <ol className="history-meters">
          {history.slice(-8).map((run, index) => {
            const value = summarize(run.metrics)[historyMetric]
            const label = `Run ${profile.completed - Math.min(history.length, 8) + index + 1} · ${stages[run.stage]}`
            return <li key={`${run.levelId}:${index}`}>
              <span>{label}</span><meter min="0" max="1" value={value} aria-label={label} /><strong>{percent(value)}</strong>
            </li>
          })}
        </ol>
        <h2>Experiment and adaptation history</h2>
        <ol className="experiment-log">
          {[...history].reverse().map((result, index) => <li key={`${result.levelId}:${index}`}>
            <strong>{stages[result.stage]} · {result.mode} · {seconds(result.metrics.durationMs)}</strong>
            <p>{result.reason}</p>
          </li>)}
        </ol>
        {!!profile.achievements.length && <><h2>Achievements</h2><ul>{profile.achievements.map((item) => <li key={item}>{item}</li>)}</ul></>}
        {!!Object.keys(profile.personalBests).length && <>
          <h2>Fastest active times by mode and maze size</h2>
          <ul>{Object.entries(profile.personalBests).sort().map(([key, time]) => <li key={key}>{key.replace(':', ' · ')}×{key.split(':')[1]} · {seconds(time)}</li>)}</ul>
        </>}
      </>}
      </div>
    </section>
  )
}
