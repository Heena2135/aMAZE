import { expect, it } from 'vitest'
import { freshProfile } from '../analytics/PlayerProfile.ts'
import { marginalCounts } from '../intelligence/MarkovModel.ts'
import { decodeProfile, saveProfile } from './ProfileStorage.ts'

it('keeps valid saved data while removing unknown keys before aggregation or export', () => {
  const profile = freshProfile()
  profile.settings.mode = 'standard'
  profile.totals.durationMs = 12.5
  profile.model.initial.left = 8
  const raw = JSON.stringify({
    ...profile,
    accidentalField: 'example',
    totals: { ...profile.totals, extraCount: 42 },
    model: { ...profile.model, extraState: null, initial: { ...profile.model.initial, note: 'example' } },
    settings: { ...profile.settings, extraSetting: true },
  })

  const restored = decodeProfile(raw)
  expect(restored).toEqual(profile)
  expect(marginalCounts(restored.model).left).toBe(8)
  expect(saveProfile({ setItem: (_, persisted) => expect(persisted).not.toContain('example') }, restored)).toBe(true)
})

it('falls back safely for fractional persisted counters', () => {
  const profile = freshProfile()
  profile.completed = 1
  profile.totals.moves = 0.5
  expect(decodeProfile(JSON.stringify(profile))).toEqual(freshProfile())
})
