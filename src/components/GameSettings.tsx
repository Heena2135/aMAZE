import { useState } from 'react'
import type { Profile } from '../analytics/PlayerProfile'

interface Props {
  profile: Profile
  onChange: (settings: Profile['settings']) => void
  onResetLearning: () => void
  onClearProgress: () => void
}

export function GameSettings({ profile, onChange, onResetLearning, onClearProgress }: Props) {
  const [confirmation, setConfirmation] = useState<'learning' | 'all' | null>(null)
  const { settings } = profile
  const exportUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2))

  return (
    <section className="panel settings" aria-labelledby="settings-title">
      <h2 id="settings-title">Settings</h2>
      <label>Next experiment mode
        <select value={settings.mode} onChange={(event) =>
          onChange({ ...settings, mode: event.target.value === 'standard' ? 'standard' : 'adaptive' })}>
          <option value="adaptive">Adaptive</option>
          <option value="standard">Standard</option>
        </select>
      </label>
      <label><input type="checkbox" checked={settings.mute} onChange={(event) =>
        onChange({ ...settings, mute: event.target.checked })} /> Mute sound</label>
      <label><input type="checkbox" checked={settings.reducedMotion} onChange={(event) =>
        onChange({ ...settings, reducedMotion: event.target.checked })} /> Reduce motion</label>
      <p>Completed experiments and learning data are stored in this browser.</p>
      <a className="action-link" href={exportUrl} download="amaze-research.json">Export research data</a>
      {confirmation ? <div className="settings-confirm">
        <p>{confirmation === 'all' ? 'Clear all progress and restore settings?' : 'Reset the prediction model and adaptive difficulty? Completed experiments are kept.'}</p>
        <button type="button" onClick={() => {
          if (confirmation === 'all') onClearProgress()
          else onResetLearning()
          setConfirmation(null)
        }}>Confirm reset</button>
        <button type="button" onClick={() => setConfirmation(null)}>Cancel</button>
      </div> : <div className="screen-actions">
        <button type="button" onClick={() => setConfirmation('learning')}>Reset learning</button>
        <button type="button" onClick={() => setConfirmation('all')}>Clear all progress</button>
      </div>}
    </section>
  )
}
