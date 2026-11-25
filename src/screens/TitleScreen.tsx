import { useState } from 'react'
import { art } from '../assets/registry'

interface Props {
  returning: boolean
  hasRunToDiscard: boolean
  onNewGame: () => void
  onContinue: () => void
  onSettings: () => void
}

export function TitleScreen({ returning, hasRunToDiscard, onNewGame, onContinue, onSettings }: Props) {
  const [confirmNew, setConfirmNew] = useState(false)
  return (
    <section className="title-screen">
        <img className="scene-art observation" src={art.backgrounds.observation} alt="" />
        <div className="ship-signal" aria-hidden="true"><i /><i /><i /></div>
        <div className="title-content">
          <p className="eyebrow">V E Y ’ S &nbsp; R E S E A R C H &nbsp; V E S S E L</p>
          <h1>a<span>MAZE</span><b>!</b></h1>
          <p className="tagline">The maze is learning. Are you?</p>
          {confirmNew ? <div className="title-menu">
            <p>Start over? This discards the current attempt and any saved experiments and learning.</p>
            <button type="button" className="primary" onClick={onNewGame}>Start over</button>
            <button type="button" onClick={() => setConfirmNew(false)}>Cancel</button>
          </div> : <div className="title-menu">
            <button className="primary" type="button" onClick={() => hasRunToDiscard ? setConfirmNew(true) : onNewGame()}>New Game</button>
            {returning && <button type="button" onClick={onContinue}>Continue</button>}
            <button type="button" onClick={onSettings}>Settings</button>
          </div>}
        </div>
        <p className="title-credit">A game by Heena Patel</p>
      </section>
  )
}
