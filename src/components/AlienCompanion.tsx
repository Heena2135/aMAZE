export function AlienCompanion({ message }: { message: string }) {
  return (
    <section className="companion panel" aria-labelledby="researcher-heading">
      <div className="researcher-portrait" aria-hidden="true">
        <span className="researcher-body" />
        <span className="researcher-signal" />
      </div>
      <div>
        <h2 id="researcher-heading">Vey · Alien researcher</h2>
        <p role="status">{message}</p>
      </div>
    </section>
  )
}
