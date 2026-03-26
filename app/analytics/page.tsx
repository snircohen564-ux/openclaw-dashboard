'use client'

import { useState, useEffect } from 'react'
import { getGatewayUrl, getGatewayToken } from '@/lib/config'
import { AGENTS } from '@/lib/config'

interface SessionStatus {
  model?: string
  tokens?: { input?: number; output?: number; total?: number }
  cost?: number
  sessions?: SessionInfo[]
  usage?: Record<string, unknown>
  [key: string]: unknown
}

interface SessionInfo {
  id?: string
  agentId?: string
  status?: string
  model?: string
  tokens?: number
  createdAt?: string
  [key: string]: unknown
}

export default function AnalyticsPage() {
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<unknown>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    setError(null)
    const base = getGatewayUrl()
    const token = getGatewayToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      // Fetch session status
      const statusRes = await fetch(`${base}/tools/invoke`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tool: 'session_status', args: {} }),
      })
      if (statusRes.ok) {
        const data = await statusRes.json()
        setRawData(data)
        const inner = data?.result ?? data
        setStatus(inner)
      }

      // Fetch sessions list
      const sessionsRes = await fetch(`${base}/tools/invoke`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tool: 'sessions_list', args: {} }),
      })
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        const list: SessionInfo[] = Array.isArray(data)
          ? data
          : data?.sessions ?? data?.result ?? []
        setSessions(list)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // Extract numeric values for display
  const tokenInput = Number(
    status?.tokens?.input ??
    (status?.usage as Record<string, unknown>)?.prompt_tokens ??
    0
  )
  const tokenOutput = Number(
    status?.tokens?.output ??
    (status?.usage as Record<string, unknown>)?.completion_tokens ??
    0
  )
  const tokenTotal = tokenInput + tokenOutput || Number(status?.tokens?.total ?? 0)
  const cost = Number(status?.cost ?? 0)

  const totalSessions = sessions.length
  const activeSessions = sessions.filter(
    (s) => s.status === 'active' || s.status === 'running'
  ).length

  // Per-agent session counts
  const agentCounts = AGENTS.map((a) => ({
    ...a,
    count: sessions.filter(
      (s) => s.agentId === a.id || (s.id && s.id.includes(a.id))
    ).length,
  }))
  const maxCount = Math.max(...agentCounts.map((a) => a.count), 1)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Usage Analytics</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Session stats and model usage
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#94a3b8' }}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: '#2d1a1a', border: '1px solid #7f1d1d', color: '#fca5a5' }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ color: '#6b7280' }}>
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Sessions" value={String(totalSessions)} icon="🗂️" />
            <StatCard label="Active Sessions" value={String(activeSessions)} icon="🟢" accent />
            <StatCard
              label="Total Tokens"
              value={tokenTotal > 0 ? formatNum(tokenTotal) : '—'}
              icon="🔢"
            />
            <StatCard
              label="Est. Cost"
              value={cost > 0 ? `$${cost.toFixed(4)}` : '—'}
              icon="💰"
            />
          </div>

          {/* Token breakdown */}
          {tokenTotal > 0 && (
            <div
              className="rounded-xl p-6 mb-6"
              style={{ background: '#1a1a2e', border: '1px solid #2a2a4a' }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#94a3b8' }}>
                Token Breakdown
              </h2>
              <div className="space-y-3">
                <TokenBar label="Input" value={tokenInput} total={tokenTotal} color="#3b82f6" />
                <TokenBar label="Output" value={tokenOutput} total={tokenTotal} color="#10b981" />
              </div>
            </div>
          )}

          {/* Per-agent sessions */}
          <div
            className="rounded-xl p-6 mb-6"
            style={{ background: '#1a1a2e', border: '1px solid #2a2a4a' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#94a3b8' }}>
              Sessions per Agent
            </h2>
            <div className="space-y-3">
              {agentCounts.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="w-5 text-center">{a.emoji}</span>
                  <span className="w-28 text-sm" style={{ color: '#e2e8f0' }}>
                    {a.name}
                  </span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#0a0a0a', height: 8 }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(a.count / maxCount) * 100}%`,
                        background: '#3b82f6',
                        minWidth: a.count > 0 ? 8 : 0,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm" style={{ color: '#6b7280' }}>
                    {a.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent sessions */}
          {sessions.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid #2a2a4a' }}
            >
              <div
                className="px-5 py-3 border-b"
                style={{ background: '#0f0f1a', borderColor: '#2a2a4a' }}
              >
                <h2 className="text-sm font-semibold" style={{ color: '#94a3b8' }}>
                  Recent Sessions ({sessions.length})
                </h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#0f0f1a', borderBottom: '1px solid #2a2a4a' }}>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: '#6b7280', fontWeight: 500 }}>ID</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: '#6b7280', fontWeight: 500 }}>Agent</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: '#6b7280', fontWeight: 500 }}>Model</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: '#6b7280', fontWeight: 500 }}>Status</th>
                    <th className="text-right px-4 py-3 text-xs" style={{ color: '#6b7280', fontWeight: 500 }}>Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 20).map((s, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < Math.min(sessions.length, 20) - 1 ? '1px solid #1a1a2e' : 'none',
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#60a5fa' }}>
                        {String(s.id ?? '—').slice(0, 20)}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                        {s.agentId ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>
                        {s.model ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={
                            s.status === 'active' || s.status === 'running'
                              ? { background: '#1a3a1a', color: '#4ade80' }
                              : { background: '#2a2a3a', color: '#6b7280' }
                          }
                        >
                          {s.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: '#6b7280' }}>
                        {s.tokens ? formatNum(Number(s.tokens)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Raw data */}
          {rawData && (
            <details className="mt-6">
              <summary
                className="cursor-pointer text-xs px-3 py-2 rounded-lg"
                style={{ color: '#6b7280', background: '#1a1a2e', border: '1px solid #2a2a4a' }}
              >
                Raw session_status response
              </summary>
              <pre
                className="mt-2 rounded-xl p-4 text-xs overflow-auto"
                style={{ background: '#0d0d1a', border: '1px solid #2a2a4a', color: '#94a3b8', maxHeight: 300 }}
              >
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </details>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon: string
  accent?: boolean
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: '#1a1a2e',
        border: `1px solid ${accent ? '#1e4a7a' : '#2a2a4a'}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
      </div>
      <div
        className="text-2xl font-bold mb-1"
        style={{ color: accent ? '#3b82f6' : '#f1f5f9' }}
      >
        {value}
      </div>
      <div className="text-xs" style={{ color: '#6b7280' }}>
        {label}
      </div>
    </div>
  )
}

function TokenBar({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-xs" style={{ color: '#94a3b8' }}>
        {label}
      </span>
      <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#0a0a0a', height: 10 }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color, minWidth: value > 0 ? 8 : 0 }}
        />
      </div>
      <span className="w-20 text-right text-xs font-mono" style={{ color: '#6b7280' }}>
        {formatNum(value)}
      </span>
    </div>
  )
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
