import { useCallback, useEffect, useState } from 'react'
import { chamberNames, readinessLine, stageBriefs } from '../assets/interface/chambers'
import { summarize } from '../analytics/MetricsCalculator'
import { AlienCompanion } from '../components/AlienCompanion'
import { GameControls } from '../components/GameControls'
import { MazeCanvas } from '../components/MazeCanvas'
import { stages } from '../game/LevelManager'
import type { GameSession } from '../hooks/useGameEngine'
import type { Direction } from '../types/Direction'

const keyDirections = new Map<string, Direction>([
  ['arrowup', 'up'], ['w', 'up'], ['arrowdown', 'down'], ['s', 'down'],
  ['arrowleft', 'left'], ['a', 'left'], ['arrowright', 'right'], ['d', 'right'],
])

interface Props {
  game: GameSession
  onOpen: (next: 'title' | 'map' | 'journal' | 'settings') => void
  onPrepare: () => void
  facing: Direction
  setFacing: (direction: Direction) => void
  checkInLevel: string | undefined
  setCheckInLevel: (level: string | undefined) => void
}

export function ChamberScreen({ game, onOpen, onPrepare, facing, setFacing, checkInLevel, setCheckInLevel }: Props) {
  const { snapshot, move, pause, start, level, profile, sound } = game
  const { status } = snapshot
  const [confirmRestart, setConfirmRestart] = useState(false)
  const checkingIn = checkInLevel === level.id

  const movePlayer = useCallback((direction: Direction) => {
    setFacing(direction)
    move(direction)
  }, [move, setFacing])

  useEffect(() => {
    if (status !== 'playing') return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement &&
        (target.isContentEditable || target.closest('input, textarea, select, [role="textbox"]'))) return
      const direction = keyDirections.get(event.key.toLowerCase())
      if (!direction && event.key !== 'Escape') return
      event.preventDefault()
      if (event.repeat) return
      if (direction) movePlayer(direction)
      else pause()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, movePlayer, pause])


  function beginChamber() {
    sound('menu')
    start()
  }

  function advanceBriefing() {
    if (checkingIn) beginChamber()
    else {
      setCheckInLevel(level.id)
      sound('communication')
    }
  }

  function toggleSound() {
    const mute = !profile.settings.mute
    game.updateSettings({ ...profile.settings, mute })
    if (!mute) sound('menu', true)
  }

  const completion = game.result
  const efficiency = completion && summarize(completion.metrics).efficiency
  const final = !!completion && level.stage === stages.length - 1
  return (
    <section className="flight" data-stage={level.stage}>
        <header className="flight-hud">
          <div className="hud-stage">
            <p className="eyebrow">CHAMBER 0{level.stage + 1} <span> / </span> {chamberNames[level.stage]}</p>
            <h1>{stages[level.stage]}</h1>
          </div>
          <div className="flight-progress" aria-label={`Chamber ${level.stage + 1} of ${stages.length}`}>
            {stages.map((label, index) => <i key={label} className={index <= level.stage ? 'lit' : ''} />)}
          </div>
          <div className="hud-actions">
            <button type="button" onClick={toggleSound} aria-pressed={!profile.settings.mute}>Sound {profile.settings.mute ? 'off' : 'on'}</button>
            <button type="button" disabled={status !== 'playing'} onClick={pause}>Pause</button>
          </div>
        </header>

        <div className="chamber-layout">
          <div className="maze-frame">
            <MazeCanvas snapshot={snapshot} layout={level.grid} hintCell={game.hintCell} stage={level.stage} facing={facing}
              reducedMotion={profile.settings.reducedMotion} />
            {status === 'paused' && <div className="flight-overlay pause-overlay">
              <div className="terminal" aria-labelledby="paused-heading">
                <p className="eyebrow">FLIGHT SYSTEMS ON HOLD</p>
                <h2 id="paused-heading">Experiment paused</h2>
                {confirmRestart ? <>
                  <p>Restart this chamber and discard the current attempt?</p>
                  <div className="action-row">
                    <button type="button" onClick={() => { game.reset(); setCheckInLevel(undefined); setFacing('down'); setConfirmRestart(false) }}>Confirm restart</button>
                    <button type="button" onClick={() => setConfirmRestart(false)}>Cancel</button>
                  </div>
                </> : <div className="action-row">
                  <button className="primary" type="button" onClick={start}>Resume</button>
                  <button type="button" onClick={() => setConfirmRestart(true)}>Restart experiment</button>
                  <button type="button" onClick={() => onOpen('journal')}>Research journal</button>
                  <button type="button" onClick={() => onOpen('settings')}>Settings</button>
                  <button type="button" onClick={() => onOpen('title')}>Return to title</button>
                </div>}
              </div>
            </div>}
          </div>
          <aside className="field-kit">
            <AlienCompanion
              message={status === 'ready' ? (checkingIn ? readinessLine : stageBriefs[level.stage]) : game.message}
              signal={status === 'ready' ? 'ready' : game.signal}
              reducedMotion={profile.settings.reducedMotion}
              response={status === 'ready' ? { label: checkingIn ? 'I’m ready!' : 'Continue dialogue', select: advanceBriefing } : undefined}
            />
            {status === 'ready' && <div className="chamber-links">
              <button type="button" className="text-control" onClick={beginChamber}>Skip briefing</button>
              <button type="button" className="text-control" onClick={() => onOpen('map')}>Journey map</button>
              <button type="button" className="text-control" onClick={() => onOpen('journal')}>Research journal</button>
              <button type="button" className="text-control" onClick={() => onOpen('title')}>Return to title</button>
            </div>}
            {completion && <div className="after-clear">
              <div className="clear-copy" aria-labelledby="completion-heading">
                <h2 id="completion-heading">{final ? 'End of transmission' : 'Experiment complete'}</h2>
                <p>{final
                  ? `You reached the last airlock in ${completion.metrics.moves} moves at ${Math.round((efficiency ?? 0) * 100)}% route efficiency. We recorded ${profile.totals.junctions} junction decisions across completed experiments. You adapted your route to reach the exit. I can use those decisions to choose future chambers when the evidence allows.`
                  : `Research note: ${completion.metrics.moves} moves with ${Math.round((efficiency ?? 0) * 100)}% route efficiency.`}</p>
                <div className="action-row">
                  <button type="button" className="primary" onClick={() => onPrepare()}>{final ? 'New endless experiment' : 'Prepare next experiment'}</button>
                  <button type="button" onClick={() => onOpen('journal')}>Research journal</button>
                  <button type="button" onClick={() => onOpen('map')}>Journey map</button>
                  <button type="button" onClick={() => onOpen('title')}>Return to title</button>
                </div>
              </div>
            </div>}
            {status === 'playing' && <div className="field-controls">
              <GameControls onMove={movePlayer} />
              <button type="button" className="hint-control" onClick={() => { game.hint(); sound('communication') }}>Request hint</button>
              <p className="key-guide">WASD / arrows to move · Esc to pause</p>
            </div>}
          </aside>
        </div>
      </section>
  )
}
