import { summarize } from '../analytics/MetricsCalculator.ts'
import type { Profile } from '../analytics/PlayerProfile'
import { stages } from '../engine/LevelManager.ts'
import { marginalCounts, turns } from '../intelligence/MarkovModel.ts'

import { seconds } from '../utils/formatTime'

const percent = (value: number) => `${Math.round(value * 100)}%`

export function ResearchReport({ profile }: { profile: Profile }) {
  const { totals, history } = profile
  const metrics = summarize(totals)
  const counts = marginalCounts(profile.model)
  const totalChoices = turns.reduce((sum, key) => sum + counts[key], 0)
  const first = history[0]
  const last = history.at(-1)
  const frequentDirection = Object.entries(totals.directions).sort((a, b) => b[1] - a[1])[0]

  return (
    <section className="panel report" aria-labelledby="report-title">
      <h2 id="report-title">Research report</h2>
      {profile.completed === 0 ? <p>Complete an experiment to collect your first observations.</p> : <>
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
        <h3>Junction decisions</h3>
        {totalChoices >= 8 ? <ul className="turn-distribution">
          {turns.map((turn) => <li key={turn}>
            <span>{turn}</span><meter min="0" max="1" value={counts[turn] / totalChoices} aria-label={turn} />
            <strong>{percent(counts[turn] / totalChoices)}</strong>
          </li>)}
        </ul> : <p>{totalChoices} recorded choices since the last learning reset. Turn preferences appear after eight.</p>}
        {totals.predictions >= 5 ? <p>
          Across all completed experiments, predictions were correct for {totals.correct} of {totals.predictions} evaluated decisions
          ({percent(metrics.accuracy)}). Mean model confidence was {percent(metrics.meanConfidence)}.
        </p> : <p>{totals.predictions} predictions evaluated. Accuracy appears after five.</p>}
        {first && last && first !== last && <p>
          Route efficiency across retained experiments went from {percent(summarize(first.metrics).efficiency)}
          {' '}to {percent(summarize(last.metrics).efficiency)} on different layouts.
        </p>}
        <h3>Adaptation history</h3>
        <ol className="experiment-log">
          {[...history].reverse().map((result, index) => <li key={`${result.levelId}:${index}`}>
            <strong>{stages[result.stage]} · {result.mode} · {seconds(result.metrics.durationMs)}</strong>
            <p>{result.reason}</p>
          </li>)}
        </ol>
        {!!profile.achievements.length && <><h3>Achievements</h3><ul>{profile.achievements.map((item) => <li key={item}>{item}</li>)}</ul></>}
        {!!Object.keys(profile.personalBests).length && <>
          <h3>Fastest active times by mode and maze size</h3>
          <ul>{Object.entries(profile.personalBests).sort().map(([key, time]) => <li key={key}>{key.replace(':', ' · ')}×{key.split(':')[1]} · {seconds(time)}</li>)}</ul>
        </>}
      </>}
    </section>
  )
}
