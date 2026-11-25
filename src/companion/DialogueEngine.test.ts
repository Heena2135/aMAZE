import { expect, it } from 'vitest'
import { DialogueEngine } from './DialogueEngine.ts'

it('keeps routine movement from crowding out reactions and gives completion priority', () => {
  const voice = new DialogueEngine()
  voice.react('playing', 0)
  voice.react('playing', 2500)
  voice.react('collision', 2600)
  expect(voice.signal).toBe('collision')
  voice.react('repeated', 2700)
  expect(voice.signal).toBe('collision')
  voice.react('repeated', 4600)
  expect(voice.signal).toBe('repeated')
  voice.react('won', 4601)
  expect(voice.signal).toBe('won')
  expect(voice.message).toBe('Amaze! Amaze! Amaze!')
})
