import { useCallback, useEffect, useRef } from 'react'
import { playCue, type SoundCue } from '../assets/audio/cues'

export function useGameAudio(muted: boolean) {
  const audio = useRef<AudioContext | null>(null)

  useEffect(() => () => {
    const context = audio.current
    audio.current = null
    if (context && context.state !== 'closed') void context.close().catch(() => {})
  }, [])

  return useCallback((cue: SoundCue, enabled = !muted) => {
    if (!enabled) return
    try {
      const context = audio.current ??= new AudioContext()
      if (context.state === 'running') playCue(context, cue)
      else void context.resume().then(() => {
        if (audio.current === context && context.state === 'running') playCue(context, cue)
      }).catch(() => {})
    } catch {
      // Browser audio access is optional.
    }
  }, [muted])
}
