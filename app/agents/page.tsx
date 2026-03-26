'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AGENTS, getGatewayUrl, getGatewayToken } from '@/lib/config'

interface Session {
  id?: string
  agentId?: string
  status?: string
}

export default function AgentsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    setLoading(true)
    setError(null)
    try {
      const base = getGatewayUrl()
      const token = getGatewayToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${base}/tools/invoke`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tool: 'sessions_list', args: {} }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      // sessions_list returns array or object with sessions
      const list = Array.isArray(data) ? data : data?.sessions ?? data?.result ?? []
      setSessions(list)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  function sessionCountFor(agentId: string) {
    return sessions.filter(
      (s) =>
        s.agentId === agentId ||
        (s.id && s.id.includes(agentId))
    ).length
  }

  const mainAgent = AGENTS[0]
  const subAgents = AGENTS.slice(1)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Orchestration</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Visual hierarchy of all OpenClaw agents
          </p>
        </div>
        <button
          onClick={fetchSessions}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#94a3b8' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Main agent */}
      <div className="flex justify-center mb-6">
        <AgentCard
          agent={mainAgent}
          sessionCount={loading ? null : sessionCountFor(mainAgent.id)}
          isMain
          onClick={() => router.push(`/chat?agent=${mainAgent.id}`)}
        />
      </div>

      {/* Connector line */}
      <div className="flex justify-center mb-6">
        <div style={{ width: 2, height: 32, background: '#2a2a4a' }} />
      </div>

      {/* Horizontal line */}
      <div className="relative flex justify-center mb-6">
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: 2,
            background: '#2a2a4a',
          }}
        />
        {/* vertical ticks */}
        {subAgents.map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `${10 + (i * 80) / (subAgents.length - 1)}%`,
              width: 2,
              height: 24,
              background: '#2a2a4a',
            }}
          />
        ))}
        <div style={{ height: 24 }} />
      </div>

      {/* Sub agents */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {subAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            sessionCount={loading ? null : sessionCountFor(agent.id)}
            onClick={() => router.push(`/chat?agent=${agent.id}`)}
          />
        ))}
      </div>

      {error && (
        <div
          className="mt-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: '#2d1a1a', border: '1px solid #7f1d1d', color: '#fca5a5' }}
        >
          Could not fetch sessions: {error}
        </div>
      )}

      {/* Sessions list */}
      {sessions.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white mb-4">Active Sessions ({sessions.length})</h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #2a2a4a' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#0f0f1a', borderBottom: '1px solid #2a2a4a' }}>
                  <th className="text-left px-4 py-3" style={{ color: '#94a3b8', fontWeight: 500 }}>Session ID</th>
                  <th className="text-left px-4 py-3" style={{ color: '#94a3b8', fontWeight: 500 }}>Agent</th>
                  <th className="text-left px-4 py-3" style={{ color: '#94a3b8', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < sessions.length - 1 ? '1px solid #2a2a4a' : 'none',
                      background: i % 2 === 0 ? 'transparent' : '#0f0f1a',
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#e2e8f0' }}>
                      {s.id ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#94a3b8' }}>
                      {s.agentId ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{ background: '#1a3a1a', color: '#4ade80' }}
                      >
                        {s.status ?? 'active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function AgentCard({
  agent,
  sessionCount,
  isMain,
  onClick,
}: {
  agent: (typeof AGENTS)[0]
  sessionCount: number | null
  isMain?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-5 text-left transition-all hover:scale-[1.02] cursor-pointer"
      style={{
        background: '#1a1a2e',
        border: isMain ? '1px solid #1e4a7a' : '1px solid #2a2a4a',
        width: isMain ? 280 : '100%',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{agent.emoji}</span>
        {sessionCount !== null && sessionCount > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: '#1e3a5f', color: '#3b82f6' }}
          >
            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="font-semibold text-white mb-1">{agent.name}</div>
      <div className="text-xs mb-2" style={{ color: '#3b82f6' }}>
        {agent.id}
      </div>
      <div className="text-xs mb-2" style={{ color: '#6b7280' }}>
        {agent.model}
      </div>
      <div className="text-xs truncate" style={{ color: '#6b7280' }}>
        {agent.description}
      </div>
      {isMain && (
        <div className="mt-3 text-xs font-mono truncate" style={{ color: '#4a4a6a' }}>
          {agent.workspace}
        </div>
      )}
    </button>
  )
}
