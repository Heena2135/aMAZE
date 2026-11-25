import { useEffect, useState, useSyncExternalStore } from 'react'
import { Vey, type VeyExpression } from './Vey'
import type { DialogueSignal } from '../companion/DialogueLibrary'

const expressions: Record<DialogueSignal, VeyExpression> = {
  ready: 'curious', playing: 'idle', paused: 'thinking', collision: 'concerned',
  repeated: 'concerned', unexpected: 'curious', hint: 'thinking', efficient: 'excited',
  improved: 'celebrating', won: 'celebrating',
}
const characterMs = 24
const motionQuery = '(prefers-reduced-motion: reduce)'

function subscribeMotion(change: () => void) {
  const query = window.matchMedia(motionQuery)
  query.addEventListener('change', change)
  return () => query.removeEventListener('change', change)
}

function systemReducedMotion() {
  return window.matchMedia(motionQuery).matches
}

interface Props {
  message: string
  signal: DialogueSignal
  reducedMotion: boolean
  response?: { label: string; select: () => void }
}

export function AlienCompanion(props: Props) {
  return <>
    <p className="sr-only" role="status">{props.message}</p>
    <Transmission key={props.message} {...props} />
  </>
}

function Transmission({ message, signal, reducedMotion, response }: Props) {
  const [count, setCount] = useState(0)
  const systemReduced = useSyncExternalStore(subscribeMotion, systemReducedMotion, () => false)
  const typing = !reducedMotion && !systemReduced && count < message.length

  useEffect(() => {
    if (!typing) return
    const timer = window.setTimeout(() => setCount(count + 1), characterMs)
    return () => window.clearTimeout(timer)
  }, [typing, count])

  const select = response?.select
  useEffect(() => {
    if (!select) return
    function onKey(event: KeyboardEvent) {
      if (event.repeat || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key !== 'Enter' && event.code !== 'Space') return
      if (event.target instanceof HTMLElement &&
        (event.target.isContentEditable || event.target.closest('button, a, input, select, textarea'))) return
      event.preventDefault()
      if (typing) setCount(message.length)
      else select?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select, typing, message.length])

  return (
    <section className="comms" aria-labelledby="comms-title">
      <Vey expression={expressions[signal]} dialogue={typing ? message : undefined}
        dialogueDuration={message.length * characterMs} />
      <div className="comms-copy">
        <h2 id="comms-title">Vey</h2>
        <p className="comms-line" aria-hidden="true">{typing ? message.slice(0, count) : message}</p>
        {(typing || response) && <div className="dialogue-responses">
          {typing && <button type="button" className="text-control" onClick={() => setCount(message.length)}>Show full line</button>}
          {response && <button type="button" className="response" onClick={response.select}>{response.label}</button>}
        </div>}
      </div>
    </section>
  )
}
