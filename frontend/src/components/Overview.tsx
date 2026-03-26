import { useEffect, useState } from 'react'
import type { OverviewStats } from '../types'

export default function Overview({ siteId, startDate, endDate }: { siteId: string; startDate: string; endDate: string }) {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (siteId) p.set('site_id', siteId)
    if (startDate) p.set('start', startDate)
    if (endDate) p.set('end', endDate)
    fetch(`/api/stats?${p}`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [siteId, startDate, endDate])

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Overview</h2>
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-value">{stats?.total_uuids?.toLocaleString() ?? '–'}</div>
          <div className="stat-label">Unique visitors</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{stats?.total_sessions?.toLocaleString() ?? '–'}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{stats?.total_events?.toLocaleString() ?? '–'}</div>
          <div className="stat-label">Events</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: 480 }}>
          <div className="card-header">Top Pages</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Page</th><th className="text-right">Views</th></tr>
              </thead>
              <tbody>
                {stats?.top_pages.map(p => (
                  <tr key={p.page_path}>
                    <td className="text-mono">{p.page_path}</td>
                    <td className="text-right">{p.views.toLocaleString()}</td>
                  </tr>
                ))}
                {stats && stats.top_pages.length === 0 && (
                  <tr><td colSpan={2} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: 480 }}>
          <div className="card-header">Top Events</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Event</th><th className="text-right">Count</th></tr>
              </thead>
              <tbody>
                {stats?.top_events.map(e => (
                  <tr key={e.event_name}>
                    <td><span className="badge-amber">{e.event_name}</span></td>
                    <td className="text-right">{e.count.toLocaleString()}</td>
                  </tr>
                ))}
                {stats && stats.top_events.length === 0 && (
                  <tr><td colSpan={2} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
