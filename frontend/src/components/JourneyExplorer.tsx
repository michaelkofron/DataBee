import { useEffect, useState } from 'react'
import type { Journey, JourneyEvent, UuidRow, HiveCondition, HiveConditionType, HiveSequence } from '../types'

const CONDITION_TYPES: { value: HiveConditionType; label: string }[] = [
  { value: 'event_name', label: 'Event name' },
  { value: 'page_path_equals', label: 'Page path equals' },
  { value: 'page_path_contains', label: 'Page path contains' },
]

const SEQUENCE_OPTIONS: { value: HiveSequence; label: string }[] = [
  { value: 'anytime', label: 'any time later' },
  { value: 'immediately', label: 'immediately followed by' },
]

function placeholderFor(type: HiveConditionType) {
  if (type === 'event_name') return 'e.g. signup'
  if (type === 'page_path_equals') return 'e.g. /pricing'
  return 'e.g. /blog'
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString()
}

function groupBySession(events: JourneyEvent[]) {
  const groups: { session_id: string; events: JourneyEvent[] }[] = []
  let current: typeof groups[number] | null = null
  for (const e of events) {
    if (!current || current.session_id !== e.session_id) {
      current = { session_id: e.session_id, events: [] }
      groups.push(current)
    }
    current.events.push(e)
  }
  return groups
}

export default function JourneyExplorer({ siteId }: { siteId: string }) {
  const [uuids, setUuids] = useState<UuidRow[]>([])
  const [uuidSearch, setUuidSearch] = useState('')
  const [query, setQuery] = useState('')
  const [journey, setJourney] = useState<Journey | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Condition filter
  const [conditions, setConditions] = useState<HiveCondition[]>([])
  const [filterActive, setFilterActive] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)

  // Load recent UUIDs (default mode)
  useEffect(() => {
    if (filterActive) return
    const p = new URLSearchParams({ limit: '30' })
    if (siteId) p.set('site_id', siteId)
    if (uuidSearch) p.set('q', uuidSearch)
    fetch(`/api/uuids?${p}`)
      .then(r => r.json())
      .then(setUuids)
      .catch(() => {})
  }, [siteId, uuidSearch, filterActive])

  const loadJourney = (uuid: string) => {
    setQuery(uuid)
    setLoading(true)
    setError('')
    const p = new URLSearchParams()
    if (siteId) p.set('site_id', siteId)
    fetch(`/api/journey/${uuid}?${p}`)
      .then(r => r.json())
      .then(j => { setJourney(j); setLoading(false) })
      .catch(() => { setError('Failed to load journey'); setLoading(false) })
  }

  const handleLookup = () => {
    if (query.trim()) loadJourney(query.trim())
  }

  // Condition filter actions
  const addCondition = () => {
    setConditions(prev => [...prev, { type: 'event_name', value: '', sequence: 'anytime' }])
  }

  const updateCondition = (i: number, patch: Partial<HiveCondition>) => {
    setConditions(prev => prev.map((c, j) => j === i ? { ...c, ...patch } : c))
  }

  const removeCondition = (i: number) => {
    const next = conditions.filter((_, j) => j !== i)
    setConditions(next)
    if (next.length === 0) clearFilter()
  }

  const applyFilter = () => {
    if (conditions.some(c => !c.value.trim())) return
    setFilterLoading(true)
    setFilterActive(true)
    fetch('/api/journey/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conditions, site_id: siteId || null, limit: 30 }),
    })
      .then(r => r.json())
      .then(setUuids)
      .catch(() => setUuids([]))
      .finally(() => setFilterLoading(false))
  }

  const clearFilter = () => {
    setConditions([])
    setFilterActive(false)
  }

  const sessions = journey ? groupBySession(journey.events) : []

  return (
    <div className="journey-grid">
      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Condition filter card */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Filter</span>
            {conditions.length === 0 && (
              <button className="btn btn-ghost" onClick={addCondition} style={{ padding: '2px 8px', fontSize: 12 }}>
                + Add
              </button>
            )}
          </div>
          {conditions.length > 0 && (
            <div className="card-body" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conditions.map((c, i) => (
                <div key={i}>
                  {i > 0 && (
                    <select
                      className="select"
                      value={c.sequence}
                      onChange={e => updateCondition(i, { sequence: e.target.value as HiveSequence })}
                      style={{ fontSize: 11, width: '100%', marginBottom: 4 }}
                    >
                      {SEQUENCE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <select
                      className="select"
                      value={c.type}
                      onChange={e => updateCondition(i, { type: e.target.value as HiveConditionType })}
                      style={{ fontSize: 11, flex: '0 0 auto', maxWidth: 110 }}
                    >
                      {CONDITION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      className="input"
                      placeholder={placeholderFor(c.type)}
                      value={c.value}
                      onChange={e => updateCondition(i, { value: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && applyFilter()}
                      style={{ flex: 1, fontSize: 11, minWidth: 0 }}
                    />
                    <button className="btn btn-ghost" onClick={() => removeCondition(i)} style={{ padding: '2px 6px', fontSize: 11 }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={addCondition} style={{ padding: '2px 8px', fontSize: 11 }}>+ Add</button>
                <div style={{ display: 'flex', gap: 4 }}>
                  {filterActive && (
                    <button className="btn btn-ghost" onClick={clearFilter} style={{ padding: '2px 8px', fontSize: 11 }}>Clear</button>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={applyFilter}
                    disabled={filterLoading || conditions.some(c => !c.value.trim())}
                    style={{ padding: '2px 10px', fontSize: 11 }}
                  >
                    {filterLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Search'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* UUID list */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <input
              className="input"
              placeholder="Search UUIDs…"
              value={uuidSearch}
              onChange={e => setUuidSearch(e.target.value)}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 11 }}
            />
          </div>
          {filterActive && (
            <div style={{ padding: '6px 14px', background: 'var(--primary-light)', fontSize: 11, color: 'var(--primary-dark)', fontWeight: 600 }}>
              {filterLoading ? 'Searching…' : `${uuids.length} matching visitor${uuids.length !== 1 ? 's' : ''}`}
            </div>
          )}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {uuids.map(u => (
              <div
                key={u.uuid + u.site_id}
                className={`uuid-list-item${journey?.uuid === u.uuid ? ' active' : ''}`}
                onClick={() => loadJourney(u.uuid)}
              >
                <div className="text-mono" style={{ fontSize: 11 }}>{u.uuid}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {u.site_name} · {formatTs(u.last_seen)}
                </div>
              </div>
            ))}
            {uuids.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                {filterActive ? 'No matches' : 'No visitors'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="Enter a UUID…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
            />
            <button className="btn btn-primary" onClick={handleLookup} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Look up'}
            </button>
          </div>
          {error && <div style={{ padding: '0 20px 12px', color: 'var(--error)', fontSize: 13 }}>{error}</div>}
        </div>

        {journey && journey.events.length > 0 ? (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-mono" style={{ fontSize: 12 }}>{journey.uuid}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{journey.events.length} events</span>
            </div>
            <div className="card-body">
              {sessions.map((s, si) => (
                <div key={s.session_id}>
                  <div className="session-divider">Session {si + 1} · {formatTs(s.events[0].timestamp)}</div>
                  {s.events.map(ev => (
                    <div className="event-row" key={ev.event_id}>
                      <div
                        className="event-dot"
                        style={{ background: ev.event_name === 'page_view' ? 'var(--border)' : 'var(--primary)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {ev.event_name !== 'page_view' && (
                            <span className="badge-amber">{ev.event_name}</span>
                          )}
                          {ev.page_path && (
                            <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>
                              {ev.page_path}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {formatTs(ev.timestamp)}
                          {ev.site_name && <> · {ev.site_name}</>}
                          {ev.properties && (
                            <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)' }}>
                              {JSON.stringify(ev.properties)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : !loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            🔍 Select a visitor or enter a UUID to view their journey
          </div>
        )}
      </div>
    </div>
  )
}
