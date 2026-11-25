type Note = readonly [frequency: number, duration: number, delay?: number]

export const cues = {
  menu: [[360, 0.055], [540, 0.06, 0.035]],
  step: [[112, 0.035]],
  collision: [[125, 0.1], [82, 0.11, 0.035]],
  communication: [[218, 0.09], [327, 0.07, 0.1], [267, 0.11, 0.18]],
  airlock: [[160, 0.12], [220, 0.17, 0.1], [330, 0.23, 0.19]],
  completion: [[392, 0.15], [523, 0.16, 0.12], [659, 0.28, 0.24]],
} satisfies Record<string, readonly Note[]>

export type SoundCue = keyof typeof cues

export function playCue(audio: AudioContext, cue: SoundCue) {
  const notes: readonly Note[] = cues[cue]
  for (const [frequency, duration, delay = 0] of notes) {
    const tone = audio.createOscillator()
    const gain = audio.createGain()
    const start = audio.currentTime + delay
    tone.type = cue === 'collision' || cue === 'step' ? 'square' : 'triangle'
    tone.frequency.value = frequency
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(cue === 'step' ? 0.018 : 0.048, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    tone.connect(gain).connect(audio.destination)
    tone.start(start)
    tone.stop(start + duration)
    tone.onended = () => {
      tone.disconnect()
      gain.disconnect()
    }
  }
}
