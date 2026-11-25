import { useEffect, useState } from 'react'
import { art } from '../assets/registry'
import { Vey } from '../components/Vey'

const lines = [
  { speaker: 'Human', portrait: 'human', text: 'Where am I? This is definitely not my room.' },
  { speaker: 'Vey', portrait: 'excited', text: 'Human awake! Excellent, excellent. Research spacecraft. Safe. Mostly safe.' },
  { speaker: 'Vey', portrait: 'curious', text: 'Human intelligence fascinating. I study. You help, question?' },
  { speaker: 'Human', portrait: 'human', text: 'What do you want me to do?' },
  { speaker: 'Vey', portrait: 'thinking', text: 'Find the gold airlock. Use arrow keys, WASD, or the direction pad. If you need me, request a hint.' },
  { speaker: 'Vey', portrait: 'celebrating', text: 'You learn the maze. The maze learns you. Shall we begin?' },
] as const

export function FirstEncounter({ onFinish, onCue }: { onFinish: () => void; onCue: () => void }) {
  const [index, setIndex] = useState(0)
  const line = lines[index]

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat || (event.key !== 'Enter' && event.code !== 'Space')) return
      if (event.defaultPrevented || (event.target instanceof HTMLElement && event.target.closest('button'))) return
      event.preventDefault()
      if (index === lines.length - 1) onFinish()
      else {
        onCue()
        setIndex(index + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onCue, onFinish])

  function advance() {
    if (index === lines.length - 1) onFinish()
    else {
      onCue()
      setIndex(index + 1)
    }
  }

  return (
    <section className="encounter" aria-label="First encounter">
      <img className="scene-art" src={art.backgrounds.sickbay} alt="" />
      {index > 0 && <Vey className="encounter-vey" expression={line.portrait === 'human' ? 'idle' : line.portrait}
        dialogue={line.speaker === 'Vey' ? line.text : undefined} />}
      <div className="encounter-location">RESEARCH VESSEL / SICKBAY</div>
      <button className="skip" type="button" onClick={onFinish}>Skip introduction</button>
      <div className="dialogue-box">
        {line.portrait === 'human'
          ? <img src={art.portraits.human} alt="" />
          : <Vey expression={line.portrait} dialogue={line.text} />}
        <div aria-live="polite" aria-atomic="true">
          <h2>{line.speaker}</h2>
          <p key={index}>{line.text}</p>
        </div>
        <div className="dialogue-actions">
          <span>{index + 1} / {lines.length}</span>
          <button type="button" onClick={advance}>{index === lines.length - 1 ? 'Enter chamber' : 'Next line'}</button>
        </div>
      </div>
    </section>
  )
}
