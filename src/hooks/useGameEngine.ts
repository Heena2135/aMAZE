import { useCallback, useEffect, useState } from 'react'
import { freshProfile } from '../analytics/PlayerProfile.ts'
import type { Profile } from '../analytics/PlayerProfile'
import { Experiment } from '../game/Experiment.ts'
import { createLevel } from '../game/LevelManager.ts'
import { loadProfile, saveProfile } from '../storage/ProfileStorage.ts'
import { useGameAudio } from './useGameAudio'
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

export function useGameEngine() {
  const [profile, setProfile] = useState(storedProfile)
  const [experiment, setExperiment] = useState(() => createExperiment(profile))
  const [view, setView] = useState(() => experiment.view())
  const [storageAvailable, setStorageAvailable] = useState(true)
  const sound = useGameAudio(profile.settings.mute)

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

  const start = useCallback(() => {
    experiment.start(performance.now())
    setView(experiment.view())
  }, [experiment])

  const pause = useCallback(() => {
    experiment.pause(performance.now())
    setView(experiment.view())
  }, [experiment])

  const move = useCallback((direction: Direction) => {
    const previousMessage = experiment.message
    const wasPlaying = experiment.status === 'playing'
    const outcome = experiment.move(direction, profile, performance.now())
    const next = experiment.view()
    setView(next)
    if (outcome.profile !== profile) setProfile(outcome.profile)
    if (wasPlaying) {
      sound(outcome.moved ? 'step' : 'collision')
      if (outcome.moved && next.snapshot.status === 'won') {
        sound('airlock')
        sound('completion')
      } else if (next.message !== previousMessage && outcome.moved) {
        sound('communication')
      }
    }
    return outcome.moved
  }, [experiment, profile, sound])

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

  function clearProgress(keepSettings = false) {
    const cleared = freshProfile()
    if (keepSettings) cleared.settings = { ...profile.settings }
    setProfile(cleared)
    replaceExperiment(cleared)
  }

  function clearLearning() {
    const cleared = { ...profile, model: freshProfile().model, difficulty: 1, learningMoves: 0, learningRevisits: 0 }
    setProfile(cleared)
    replaceExperiment(cleared)
  }

  return {
    ...view, level: experiment.level, profile, storageAvailable, sound, start, pause, move, reset, hint,
    nextLevel: (stage?: number) => replaceExperiment(profile, stage), updateSettings, clearLearning, clearProgress,
  }
}

export type GameSession = ReturnType<typeof useGameEngine>
