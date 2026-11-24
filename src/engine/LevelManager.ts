import { selectMaze } from '../intelligence/AdaptiveMazeGenerator.ts'
import type { Mode, Profile } from '../analytics/PlayerProfile'

export const stages = ['First Contact', 'Observation', 'Adaptation', 'Outsmart', 'Amaze'] as const
const sizes = [7, 9, 11, 13, 15]

export function stageFor(profile: Profile): number {
  return profile.unlockedStage
}

export function createLevel(profile: Profile, seed: number, selectedStage = stageFor(profile), mode: Mode = profile.settings.mode) {
  const personalize = mode === 'adaptive' && selectedStage >= 2
  const size = sizes[selectedStage]
  const maze = selectMaze({ size, seed, personalize, profile })
  const stageReason = selectedStage < 2 && mode === 'adaptive'
    ? 'Baseline experiment. Junction choices can inform later stages.'
    : maze.reason
  return { ...maze, reason: stageReason, stage: selectedStage, size, mode,
    difficulty: personalize ? profile.difficulty : 1, id: `${selectedStage}-${maze.seed}` }
}

export type Level = ReturnType<typeof createLevel>
