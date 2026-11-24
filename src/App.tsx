import { useEffect, useState } from 'react'
import { AlienCompanion } from './components/AlienCompanion'
import { GameControls } from './components/GameControls'
import { GameHeader } from './components/GameHeader'
import { GameSettings } from './components/GameSettings'
import { GameStats } from './components/GameStats'
import { MazeCanvas } from './components/MazeCanvas'
import { ResearchReport } from './components/ResearchReport'
import { seconds } from './utils/formatTime'
import { stageFor, stages } from './engine/LevelManager.ts'
import { useGameEngine } from './hooks/useGameEngine'
import type { Direction } from './types/Direction'
import './App.css'

const keyDirections = new Map<string, Direction>([
  ['arrowup', 'up'], ['w', 'up'],
  ['arrowdown', 'down'], ['s', 'down'],
  ['arrowleft', 'left'], ['a', 'left'],
  ['arrowright', 'right'], ['d', 'right'],
])

type Screen = 'title' | 'experiment' | 'progress' | 'report' | 'settings'
const stageBriefs = [
  'Find the gold exit. Vey will use this run as a baseline for later experiments.',
  'Larger chambers offer more junctions. Vey records choices made where the route branches.',
  'Route length and dead ends now influence maze selection. Turn preferences can matter once there is enough evidence.',
  'Test a new route strategy. Vey checks confident forecasts against decisions you make afterward.',
  'Finish the calibrated challenge and review how your navigation and the model developed.',
]

function App() {
  const game = useGameEngine()
  const { snapshot, move, pause, level, profile } = game
  const { status } = snapshot
  const [screen, setScreen] = useState<Screen>('title')
  const unlockedStage = stageFor(profile)

  useEffect(() => {
    if (screen !== 'experiment' || status !== 'playing') return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement &&
        (target.isContentEditable || target.closest('input, textarea, select, [role="textbox"]'))) return

      const direction = keyDirections.get(event.key.toLowerCase())
      if (!direction && event.key !== 'Escape') return
      event.preventDefault()
      if (event.repeat) return
      if (direction) move(direction)
      else pause()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screen, status, move, pause])

  function navigate(next: Screen) {
    if (next !== 'experiment' && status === 'playing') pause()
    setScreen(next)
  }

  function nextExperiment(stage?: number) {
    game.nextLevel(stage)
    setScreen('experiment')
  }

  return (
    <main className="lab" data-reduced-motion={profile.settings.reducedMotion}>
      <GameHeader stage={screen === 'experiment' ? stages[level.stage] : undefined} />
      <nav className="lab-nav" aria-label="Laboratory">
        {([
          ['title', 'Title'], ['experiment', 'Experiment'], ['progress', 'Progression'],
          ['report', 'Research report'], ['settings', 'Settings'],
        ] as const).map(([value, label]) =>
          <button type="button" key={value} aria-current={screen === value ? 'page' : undefined}
            onClick={() => navigate(value)}>{label}</button>,
        )}
      </nav>
      {!game.storageAvailable && <p role="status" className="notice">Local storage is unavailable. Progress will last for this visit.</p>}
      {screen === 'title' && <section className="panel arrival">
        <div className="arrival-window" aria-hidden="true"><span className="arrival-planet" /></div>
        <div>
          <h2>A human aboard the research vessel</h2>
          <p>Vey is studying human navigation. Find the exit, then see how your decisions influence the next chamber.</p>
          <button className="begin-button" type="button" onClick={() => navigate('experiment')}>Enter the laboratory</button>
        </div>
      </section>}
      {screen === 'experiment' && <div className="lab-layout">
        <section className="maze-panel panel" aria-labelledby="maze-heading">
          <div className="maze-heading">
            <h2 id="maze-heading">Maze chamber</h2>
            <div className="maze-legend">
              <span><i className="player-marker" /> Player</span>
              <span><i className="exit-marker" /> Exit</span>
              {game.hintCell && <span><i className="hint-marker" /> Hint</span>}
            </div>
          </div>
          <div className="maze-frame">
            <MazeCanvas snapshot={snapshot} hintCell={game.hintCell} />
            {status === 'paused' && <div className="pause-screen">
              <p>Experiment paused</p>
              <button type="button" className="begin-button" onClick={game.start}>Resume from pause</button>
            </div>}
          </div>
          <GameStats moveCount={snapshot.moveCount} collisionCount={snapshot.collisionCount} status={status} />
        </section>
        <div className="lab-sidebar">
          <AlienCompanion message={game.message} />
          {status === 'ready' && <section className="panel brief">
            <h2>Experiment briefing</h2>
            <p>{stageBriefs[level.stage]}</p>
            <p>{level.mode === 'standard' ? 'Standard mode is active. Layout selection is independent of your profile.' : level.reason}</p>
          </section>}
          {game.result && <section className="panel brief completion" aria-labelledby="completion-heading">
            <h2 id="completion-heading">{level.stage === 4 ? 'Final experiment summary' : 'Experiment complete'}</h2>
            <p>{game.result.metrics.moves} moves · {game.result.metrics.optimalMoves} optimal · {game.result.metrics.hints} hints · {seconds(game.result.metrics.durationMs)}</p>
            {level.stage === 4 && <p>Five stages complete. You finished {profile.completed} experiments and recorded {profile.totals.junctions} junction decisions. Replay a stage or continue with fresh Amaze layouts.</p>}
            <div className="screen-actions">
              <button type="button" className="begin-button" onClick={() => nextExperiment()}>
                {level.stage === 4 ? 'New endless experiment' : 'Prepare next experiment'}
              </button>
              <button type="button" onClick={() => navigate('report')}>View research</button>
            </div>
          </section>}
          <GameControls status={status} onStart={game.start} onPause={pause} onMove={move} onHint={game.hint} onReset={game.reset} />
        </div>
      </div>}
      {screen === 'progress' && <section className="panel progress" aria-labelledby="progress-title">
        <h2 id="progress-title">Experiment progression</h2>
        <ol className="experiment-log">
          {stages.map((stage, index) => <li key={stage}>
            <div><strong>{stage}</strong><p>{stageBriefs[index]}</p></div>
            <button type="button" disabled={index > unlockedStage} onClick={() => nextExperiment(index)}>
              {index > unlockedStage ? 'Locked' : `Prepare ${stage}`}
            </button>
          </li>)}
        </ol>
      </section>}
      {screen === 'report' && <ResearchReport profile={profile} />}
      {screen === 'settings' && <GameSettings profile={profile} onChange={game.updateSettings}
        onResetLearning={game.clearLearning} onClearProgress={game.clearProgress} />}
    </main>
  )
}

export default App
