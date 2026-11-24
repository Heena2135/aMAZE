import type { Direction } from '../types/Direction'

export const turns = ['left', 'right', 'straight', 'reverse'] as const
export type Turn = typeof turns[number]
export type Counts = Record<Turn, number>
export type Model = Record<Turn | 'initial', Counts>

export function emptyCounts(): Counts {
  return { left: 0, right: 0, straight: 0, reverse: 0 }
}

export function emptyModel(): Model {
  return { initial: emptyCounts(), left: emptyCounts(), right: emptyCounts(), straight: emptyCounts(), reverse: emptyCounts() }
}

const clockwise: Direction[] = ['up', 'right', 'down', 'left']

export function relativeTurn(heading: Direction, next: Direction): Turn {
  return (['straight', 'right', 'reverse', 'left'] as const)[
    (clockwise.indexOf(next) - clockwise.indexOf(heading) + 4) % 4
  ]
}

export function predict(model: Model, previous: Turn | 'initial', options: readonly Turn[]) {
  const row = model[previous]
  const conditionalSamples = options.reduce((sum, turn) => sum + row[turn], 0)
  const counts = conditionalSamples >= 5 ? row : marginalCounts(model)
  const samples = options.reduce((sum, turn) => sum + counts[turn], 0)
  const probabilities = emptyCounts()
  for (const turn of options) probabilities[turn] = (counts[turn] + 1) / (samples + options.length)

  const ranked = [...options].sort((a, b) => probabilities[b] - probabilities[a])
  const [best, second] = ranked
  const confidence = best ? probabilities[best] : 0
  return {
    probabilities, confidence, samples,
    choice: best && second && samples >= 8 && confidence - probabilities[second] >= 0.12 ? best : null,
  }
}

export function marginalCounts(model: Model): Counts {
  const counts = emptyCounts()
  for (const row of Object.values(model)) for (const turn of turns) counts[turn] += row[turn]
  return counts
}
