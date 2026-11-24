import { generateMaze } from '../algorithms/MazeGenerator.ts'
import { analyzeMaze, routeDirection } from '../algorithms/MazeAnalyzer.ts'
import { openNeighbors } from '../algorithms/PathFinder.ts'
import { marginalCounts, predict, relativeTurn, turns } from './MarkovModel.ts'
import type { Turn } from './MarkovModel'
import type { Profile } from '../analytics/PlayerProfile'

export interface CandidateOptions {
  size: number
  seed: number
  personalize: boolean
  profile: Profile
}

export function selectMaze({ size, seed, personalize, profile }: CandidateOptions) {
  const candidates = Array.from({ length: personalize ? 9 : 1 }, (_, i) => {
    const layout = generateMaze(size, size, (seed + Math.imul(i, 0x9e3779b9)) >>> 0)
    return { ...layout, topology: analyzeMaze(layout.grid, layout.start, layout.exit) }
  }).filter(({ topology }) => topology.shortestPath !== null)
  if (candidates.length === 0) throw new Error('No solvable maze candidates.')

  if (!personalize) return { ...candidates[0], reason: 'Seeded standard layout. BFS verified a path to the exit.' }

  const counts = marginalCounts(profile.model)
  const observations = turns.reduce((sum, turn) => sum + counts[turn], 0)
  const target = size * (1.9 + profile.difficulty * 0.62)
  const recovery = profile.learningRevisits / Math.max(1, profile.learningMoves)
  const scored = candidates.map((candidate) => {
    const { topology, grid } = candidate
    let previous: Turn | 'initial' = 'initial'
    let tested = 0
    let challenge = 0
    for (let i = 1; i < topology.route.length - 1; i++) {
      const cell = topology.route[i]
      const branches = openNeighbors(grid, cell)
      if (branches.length < 3) continue
      const heading = routeDirection(topology.route[i - 1], cell)
      const required = relativeTurn(heading, routeDirection(cell, topology.route[i + 1]))
      const options = branches.map((branch) => relativeTurn(heading, branch.direction))
      const forecast = predict(profile.model, previous, options)
      if (forecast.choice) {
        tested++
        challenge += forecast.choice === required ? 0 : forecast.confidence
      }
      previous = required
    }
    const lengthPenalty = Math.abs(topology.shortestPath! - target) / target
    const branchPenalty = topology.deadEnds / size * (recovery > 0.28 ? 0.35 : 0.12)
    const score = -lengthPenalty - branchPenalty + (tested ? challenge / tested * 0.24 : 0)
    return { candidate, score, tested, challenge }
  }).sort((a, b) => b.score - a.score)
  const { candidate, tested, challenge } = scored[0]
  const length = candidate.topology.shortestPath
  const reasons = [`Selected among ${candidates.length} solvable layouts. Shortest route ${length} moves, target about ${Math.round(target)}.`]
  if (recovery > 0.28) reasons.push('Frequent revisits increased the penalty for dead ends.')
  if (tested && challenge) reasons.push(`The solution asks for a different choice than the model favors at some of ${tested} evaluated junctions.`)
  else if (observations < 8) reasons.push('There are too few junction decisions for turn-based personalization.')
  else reasons.push('Route length and dead ends drove this selection.')
  return { ...candidate, reason: reasons.join(' ') }
}
