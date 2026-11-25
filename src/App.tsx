import { useCallback, useEffect, useRef, useState } from 'react'
import { ExpeditionMap } from './screens/ExpeditionMap'
import { FirstEncounter } from './screens/FirstEncounter'
import { GameSettings } from './screens/GameSettings'
import { ResearchReport } from './screens/ResearchReport'
import { stageFor } from './game/LevelManager.ts'
import { useGameEngine } from './hooks/useGameEngine'
import { ChamberScreen } from './screens/ChamberScreen'
import { TitleScreen } from './screens/TitleScreen'
import type { Direction } from './types/Direction'
import './App.css'

const introKey = 'amaze-introduction-seen'
type Screen = 'title' | 'intro' | 'experiment' | 'map' | 'journal' | 'settings'

function introductionSeen() {
  try { return localStorage.getItem(introKey) === 'yes' } catch { return false }
}

function App() {
  const game = useGameEngine()
  const { snapshot, pause, level, profile, sound } = game
  const { status } = snapshot
  const [screen, setScreen] = useState<Screen>('title')
  const [returnScreen, setReturnScreen] = useState<Screen>('title')
  const [seenIntro, setSeenIntro] = useState(introductionSeen)
  const [inSession, setInSession] = useState(false)
  const [facing, setFacing] = useState<Direction>('down')
  const [checkInLevel, setCheckInLevel] = useState<string>()
  const stage = stageFor(profile)
  const sceneStart = useRef<HTMLElement>(null)

  const finishIntro = useCallback(() => {
    try { localStorage.setItem(introKey, 'yes') } catch { /* Session flag still applies. */ }
    setSeenIntro(true)
    setScreen('experiment')
    sound('communication')
  }, [sound])

  useEffect(() => {
    sceneStart.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [screen])


  function newGame() {
    sound('menu')
    if (profile.completed) game.clearProgress(true)
    else game.nextLevel(0)
    setInSession(true)
    setFacing('down')
    setCheckInLevel(undefined)
    setScreen('intro')
  }

  function continueGame() {
    sound('menu')
    setInSession(true)
    setScreen('experiment')
  }

  function open(next: Screen, origin = screen) {
    sound('menu')
    if (status === 'playing') pause()
    setReturnScreen(origin)
    setScreen(next)
  }

  function prepare(selectedStage?: number) {
    sound('menu')
    game.nextLevel(selectedStage)
    setFacing('down')
    setCheckInLevel(undefined)
    setScreen('experiment')
  }

  const returning = inSession || seenIntro || profile.completed > 0
  const hasRunToDiscard = profile.completed > 0 || status === 'playing' || status === 'paused' || status === 'won'

  return (
    <main className={`game-shell scene-${screen}`} data-reduced-motion={profile.settings.reducedMotion} ref={sceneStart} tabIndex={-1}>
      {!game.storageAvailable && <p role="status" className="storage-note">Progress is available for this visit only.</p>}

      {screen === 'title' && <TitleScreen returning={returning} hasRunToDiscard={hasRunToDiscard}
        onNewGame={newGame} onContinue={continueGame} onSettings={() => open('settings')} />}

      {screen === 'intro' && <FirstEncounter onFinish={finishIntro} onCue={() => sound('communication')} />}

      {screen === 'experiment' && <ChamberScreen game={game} onOpen={open} onPrepare={prepare}
        facing={facing} setFacing={setFacing} checkInLevel={checkInLevel} setCheckInLevel={setCheckInLevel} />}

      {(screen === 'map' || screen === 'journal' || screen === 'settings') && <div className="subscreen">
        <div className="subscreen-top">
          <button type="button" onClick={() => { sound('menu'); setScreen(returnScreen) }}>← Back</button>
        </div>
        {screen === 'map' && <ExpeditionMap unlocked={stage} current={level.stage} onSelect={prepare} />}
        {screen === 'journal' && <ResearchReport profile={profile} chamber={{ stage: level.stage, mode: level.mode, reason: level.reason }} />}
        {screen === 'settings' && <GameSettings profile={profile} onChange={(settings) => {
          game.updateSettings(settings)
          if (profile.settings.mute && !settings.mute) sound('menu', true)
        }} onResetLearning={game.clearLearning} onClearProgress={() => {
          game.clearProgress()
          try { localStorage.removeItem(introKey) } catch { /* Session flag still applies. */ }
          setFacing('down')
          setCheckInLevel(undefined)
          setSeenIntro(false)
          setInSession(false)
          setReturnScreen('title')
        }} />}
      </div>}
    </main>
  )
}

export default App
