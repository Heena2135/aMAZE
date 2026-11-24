export function GameHeader({ stage }: { stage?: string }) {
  return (
    <header className="game-header">
      <div>
        <h1>a<span>MAZE</span>!</h1>
        <p>The maze is learning. Are you?</p>
      </div>
      {stage && <p className="stage"><span>Experiment stage</span> {stage}</p>}
    </header>
  )
}
