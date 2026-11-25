import type { Profile } from '../analytics/PlayerProfile'

export function ResearchExport({ profile }: { profile: Profile }) {
  const href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2))
  return <a className="action-link" href={href} download="amaze-research.json">Export research data</a>
}
