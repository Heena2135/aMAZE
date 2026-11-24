import { freshProfile } from '../analytics/PlayerProfile.ts'
import type { Profile } from '../analytics/PlayerProfile'
import { emptyMetrics } from '../analytics/SessionAnalyzer.ts'
import { emptyModel } from '../intelligence/MarkovModel.ts'

export const storageKey = 'amaze-profile-v1'
const maxBytes = 65_536

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const number = (value: unknown, max = 1e15): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
const integer = (value: unknown, max?: number): value is number =>
  number(value, max) && Number.isInteger(value)

function numericShape(value: unknown, shape: object, allowDecimals = false): boolean {
  return object(value) && Object.entries(shape).every(([key, sample]) =>
    typeof sample === 'number'
      ? (allowDecimals ? number(value[key]) : integer(value[key]))
      : numericShape(value[key], sample, allowDecimals),
  )
}

const mode = (value: unknown) => value === 'adaptive' || value === 'standard'

function validProfile(value: unknown): value is Profile {
  if (!object(value) || value.version !== 1 || !integer(value.completed) || !integer(value.unlockedStage, 4) ||
    value.unlockedStage > value.completed || !number(value.difficulty, 4) ||
    !integer(value.learningMoves) || !integer(value.learningRevisits, value.learningMoves) ||
    !object(value.settings) || !mode(value.settings.mode) || typeof value.settings.mute !== 'boolean' ||
    typeof value.settings.reducedMotion !== 'boolean' || !numericShape(value.totals, emptyMetrics(), true) ||
    !numericShape(value.model, emptyModel()) || !object(value.personalBests) ||
    !Object.entries(value.personalBests).every(([key, time]) => /^(adaptive|standard):(7|9|11|13|15)$/.test(key) && number(time)) ||
    !Array.isArray(value.achievements) || value.achievements.length > 12 ||
    !value.achievements.every((item) => typeof item === 'string' && item.length <= 100) ||
    !Array.isArray(value.history) || value.history.length > 24 || value.history.length > value.completed) return false

  return value.history.every((result: unknown) => object(result) && typeof result.levelId === 'string' &&
    result.levelId.length < 80 && integer(result.stage, 4) && result.size === 7 + 2 * result.stage &&
    number(result.difficulty, 4) && mode(result.mode) && typeof result.reason === 'string' &&
    result.reason.length < 1000 && numericShape(result.metrics, emptyMetrics(), true))
}

export function decodeProfile(raw: string | null): Profile {
  if (!raw || raw.length > maxBytes) return freshProfile()
  try {
    const decoded: unknown = JSON.parse(raw)
    if (validProfile(decoded)) return decoded
  } catch {
    // Invalid JSON is handled the same way as invalid schema data.
  }
  return freshProfile()
}

export function loadProfile(storage: Pick<Storage, 'getItem'>): Profile {
  try {
    return decodeProfile(storage.getItem(storageKey))
  } catch {
    return freshProfile()
  }
}

export function saveProfile(storage: Pick<Storage, 'setItem'>, profile: Profile): boolean {
  try {
    const raw = JSON.stringify(profile)
    if (raw.length > maxBytes) return false
    storage.setItem(storageKey, raw)
    return true
  } catch {
    return false
  }
}
