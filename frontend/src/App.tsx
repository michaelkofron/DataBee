import { useEffect, useState } from 'react'

export default function App() {
  const [healthy, setHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setHealthy(d.status === 'ok'))
      .catch(() => setHealthy(false))
  }, [])

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 24px' }}>
      <header style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          DataBee
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Multi-site user journey analytics
        </p>
      </header>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 24,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: healthy === null ? 'var(--text-muted)' : healthy ? '#22c55e' : 'var(--error)',
          flexShrink: 0,
        }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          {healthy === null ? 'Checking backend…' : healthy ? 'Backend connected' : 'Backend unreachable'}
        </span>
      </div>
    </div>
  )
}
