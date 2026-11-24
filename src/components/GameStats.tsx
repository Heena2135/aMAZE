import type { GameSnapshot } from '../types/GameSnapshot'

type GameStatsProps = Pick<GameSnapshot, 'moveCount' | 'collisionCount' | 'status'>

export function GameStats({ moveCount, collisionCount, status }: GameStatsProps) {
  return (
    <dl className="game-stats">
      <div><dt>Moves</dt><dd>{moveCount}</dd></div>
      <div><dt>Collisions</dt><dd>{collisionCount}</dd></div>
      <div><dt>Status</dt><dd className="status" role="status">{status}</dd></div>
    </dl>
  )
}
