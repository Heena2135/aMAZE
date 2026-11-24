import { useCallback, useEffect, useRef, useState } from 'react'
import { freshProfile } from '../analytics/PlayerProfile.ts'
import type { Profile } from '../analytics/PlayerProfile'
import { Experiment } from '../engine/Experiment.ts'
import { createLevel } from '../engine/LevelManager.ts'
import { loadProfile, saveProfile } from '../storage/ProfileStorage.ts'
import type { Direction } from '../types/Direction'

const randomSeed = () => Math.floor(Math.random() * 2 ** 32)

function storedProfile() {
  try {
    return loadProfile(window.localStorage)
  } catch {
    return freshProfile()
  }
}

function createExperiment(profile: Profile, stage?: number) {
  return new Experiment(createLevel(profile, randomSeed(), stage), profile)
}

function playTone(contextRef: { current: AudioContext | null }, victory: boolean) {
  try {
    const audio = contextRef.current ??= new AudioContext()
    void audio.resume().catch(() => {})
    const tone = audio.createOscillator()
    const gain = audio.createGain()
    const now = audio.currentTime
    tone.type = 'triangle'
    tone.frequency.setValueAtTime(victory ? 440 : 146, now)
    tone.frequency.exponentialRampToValueAtTime(victory ? 660 : 95, now + 0.14)
    gain.gain.setValueAtTime(0.075, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    tone.connect(gain).connect(audio.destination)
    tone.start(now)
    tone.stop(now + 0.18)
  } catch {
    // Audio can be unavailable in embedded browsers.
  }
}

export function useGameEngine() {
  const [profile, setProfile] = useState(storedProfile)
  const [experiment, setExperiment] = useState(() => createExperiment(profile))
  const [view, setView] = useState(() => experiment.view())
  const [storageAvailable, setStorageAvailable] = useState(true)
  const audio = useRef<AudioContext | null>(null)

  useEffect(() => {
    let available = false
    try {
      available = saveProfile(window.localStorage, profile)
    } catch {
      // The storage getter itself can be blocked.
    }
    const notice = window.setTimeout(() => setStorageAvailable(available), 0)
    return () => window.clearTimeout(notice)
  }, [profile])

  useEffect(() => () => {
    void audio.current?.close().catch(() => {})
    audio.current = null
  }, [])

  const start = useCallback(() => {
    experiment.start(performance.now())
    setView(experiment.view())
  }, [experiment])

  const pause = useCallback(() => {
    experiment.pause(performance.now())
    setView(experiment.view())
  }, [experiment])

  const move = useCallback((direction: Direction) => {
    const wasPlaying = experiment.status === 'playing'
    const outcome = experiment.move(direction, profile, performance.now())
    const next = experiment.view()
    setView(next)
    if (outcome.profile !== profile) setProfile(outcome.profile)
    if (!profile.settings.mute && wasPlaying && (!outcome.moved || next.snapshot.status === 'won')) {
      playTone(audio, next.snapshot.status === 'won')
    }
    return outcome.moved
  }, [experiment, profile])

  function reset() {
    experiment.reset(profile, performance.now())
    setView(experiment.view())
  }

  function hint() {
    experiment.hint(performance.now())
    setView(experiment.view())
  }

  function replaceExperiment(nextProfile: Profile, stage?: number) {
    const next = createExperiment(nextProfile, stage)
    setExperiment(next)
    setView(next.view())
  }

  function updateSettings(settings: Profile['settings']) {
    const next = { ...profile, settings }
    setProfile(next)
    if (settings.mode !== profile.settings.mode && experiment.status === 'ready') {
      replaceExperiment(next, experiment.level.stage)
    }
  }

  function clearProgress() {
    const cleared = freshProfile()
    setProfile(cleared)
    replaceExperiment(cleared)
  }

  function clearLearning() {
    const cleared = { ...profile, model: freshProfile().model, difficulty: 1, learningMoves: 0, learningRevisits: 0 }
    setProfile(cleared)
    replaceExperiment(cleared)
  }

  return {
    ...view, level: experiment.level, profile, storageAvailable, start, pause, move, reset, hint,
    nextLevel: (stage?: number) => replaceExperiment(profile, stage), updateSettings, clearLearning, clearProgress,
  }
}
