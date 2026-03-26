'use client'

import { useState, useEffect } from 'react'
import { getGatewayUrl, getGatewayToken } from '@/lib/config'

interface CronJob {
  id?: string
  name?: string
  schedule?: string
  payload?: string | Record<string, unknown>
  enabled?: boolean
  [key: string]: unknown
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<CronJob>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [newJob, setNewJob] = useState({ name: '', schedule: '', payload: '' })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [chatJobId, setChatJobId] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  async function invokeGateway(tool: string, args: Record<string, unknown>) {
    const base = getGatewayUrl()
    const token = getGatewayToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${base}/tools/invoke`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tool, args }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`${res.status}: ${text}`)
    }
    return res.json()
  }

  async function fetchJobs() {
    setLoading(true)
    setError(null)
    try {
      const data = await invokeGateway('cron', { action: 'list' })
      // Handle various response shapes
      const list: CronJob[] = Array.isArray(data)
        ? data
        : data?.jobs ?? data?.result ?? data?.crons ?? []
      setJobs(list)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  async function toggleJob(job: CronJob) {
    try {
      const id = job.id ?? job.name
      await invokeGateway('cron', {
        action: job.enabled ? 'disable' : 'enable',
        id,
      })
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id || j.name === job.name) ? { ...j, enabled: !j.enabled } : j)
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function deleteJob(id: string) {
    try {
      await invokeGateway('cron', { action: 'delete', id })
      setJobs((prev) => prev.filter((j) => j.id !== id && j.name !== id))
      setConfirmDelete(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function saveEdit(job: CronJob) {
    try {
      const id = job.id ?? job.name
      await invokeGateway('cron', {
        action: 'update',
        id,
        ...editValues,
      })
      setJobs((prev) =>
        prev.map((j) => (j.id === id || j.name === id) ? { ...j, ...editValues } : j)
      )
      setEditingId(null)
      setEditValues({})
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function createJob() {
    try {
      await invokeGateway('cron', {
        action: 'create',
        name: newJob.name,
        schedule: newJob.schedule,
        payload: newJob.payload,
        enabled: true,
      })
      setShowCreate(false)
      setNewJob({ name: '', schedule: '', payload: '' })
      fetchJobs()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function askOpenClaw(job: CronJob) {
    if (!chatInput.trim()) return
    setChatLoading(true)
    setChatResponse('')
    try {
      const base = getGatewayUrl()
      const token = getGatewayToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': 'main',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'openclaw:main',
          messages: [
            {
              role: 'user',
              content: `I want to modify this cron job: ${JSON.stringify(job)}\n\nChange request: ${chatInput}`,
            },
          ],
          stream: false,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setChatResponse(data?.choices?.[0]?.message?.content ?? 'No response')
      } else {
        setChatResponse(`Error ${res.status}`)
      }
    } catch (e: unknown) {
      setChatResponse(e instanceof Error ? e.message : 'Error')
    } finally {
      setChatLoading(false)
    }
  }

  const jobKey = (j: CronJob) => String(j.id ?? j.name ?? Math.random())

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Cron Jobs</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Manage scheduled tasks and automation
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchJobs}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#94a3b8' }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#3b82f6', color: 'white' }}
          >
            + New Job
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm flex items-center justify-between"
          style={{ background: '#2d1a1a', border: '1px solid #7f1d1d', color: '#fca5a5' }}
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ color: '#6b7280' }}>
          Loading cron jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#6b7280' }}
        >
          <p className="text-lg mb-2">No cron jobs found</p>
          <p className="text-sm">Create your first scheduled task above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const key = jobKey(job)
            const isEditing = editingId === key
            const isChatOpen = chatJobId === key

            return (
              <div
                key={key}
                className="rounded-xl p-5"
                style={{ background: '#1a1a2e', border: '1px solid #2a2a4a' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleJob(job)}
                      className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                      style={{ background: job.enabled ? '#3b82f6' : '#2a2a4a' }}
                      title={job.enabled ? 'Disable' : 'Enable'}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all"
                        style={{ left: job.enabled ? '1.25rem' : '0.125rem' }}
                      />
                    </button>
                    <div>
                      <span className="font-medium text-white">{job.name ?? job.id ?? 'Unnamed'}</span>
                      {job.enabled === false && (
                        <span
                          className="ml-2 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#2a2a3a', color: '#6b7280' }}
                        >
                          disabled
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (isEditing) {
                          setEditingId(null)
                          setEditValues({})
                        } else {
                          setEditingId(key)
                          setEditValues({ schedule: job.schedule, payload: typeof job.payload === 'string' ? job.payload : JSON.stringify(job.payload ?? '') })
                        }
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#2a2a4a', color: isEditing ? '#3b82f6' : '#94a3b8' }}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      onClick={() => setChatJobId(isChatOpen ? null : key)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#1e2a3a', color: '#60a5fa' }}
                    >
                      💬 Ask
                    </button>
                    <button
                      onClick={() => setConfirmDelete(key)}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: '#2d1a1a', color: '#fca5a5' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Schedule</label>
                      <input
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono"
                        style={{ background: '#0a0a0a', border: '1px solid #2a2a4a', color: '#f1f5f9' }}
                        value={editValues.schedule ?? ''}
                        onChange={(e) => setEditValues((v) => ({ ...v, schedule: e.target.value }))}
                        placeholder="*/5 * * * *"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Payload / Message</label>
                      <textarea
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono resize-none"
                        style={{ background: '#0a0a0a', border: '1px solid #2a2a4a', color: '#f1f5f9' }}
                        rows={3}
                        value={typeof editValues.payload === 'string' ? editValues.payload : JSON.stringify(editValues.payload ?? '')}
                        onChange={(e) => setEditValues((v) => ({ ...v, payload: e.target.value }))}
                      />
                    </div>
                    <button
                      onClick={() => saveEdit(job)}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: '#3b82f6', color: 'white' }}
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#6b7280' }}>Schedule:</span>
                      <code className="text-xs font-mono" style={{ color: '#60a5fa' }}>
                        {job.schedule ?? '—'}
                      </code>
                    </div>
                    {job.payload && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Payload:</span>
                        <code
                          className="text-xs font-mono break-all"
                          style={{ color: '#94a3b8', maxWidth: '80%' }}
                        >
                          {typeof job.payload === 'string'
                            ? job.payload
                            : JSON.stringify(job.payload).slice(0, 200)}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* Mini chat */}
                {isChatOpen && (
                  <div
                    className="mt-4 rounded-lg p-4"
                    style={{ background: '#0f0f1a', border: '1px solid #2a2a4a' }}
                  >
                    <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                      Describe the change you want for this cron job:
                    </p>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#f1f5f9' }}
                        placeholder="e.g., Change to run every hour instead of every 5 minutes"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && askOpenClaw(job)}
                      />
                      <button
                        onClick={() => askOpenClaw(job)}
                        disabled={chatLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ background: '#3b82f6', color: 'white', opacity: chatLoading ? 0.7 : 1 }}
                      >
                        {chatLoading ? '...' : 'Ask'}
                      </button>
                    </div>
                    {chatResponse && (
                      <div
                        className="mt-3 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
                        style={{ background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #2a2a4a' }}
                      >
                        {chatResponse}
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm delete */}
                {confirmDelete === key && (
                  <div
                    className="mt-4 rounded-lg p-3 flex items-center justify-between"
                    style={{ background: '#2d1a1a', border: '1px solid #7f1d1d' }}
                  >
                    <span className="text-sm" style={{ color: '#fca5a5' }}>
                      Delete &ldquo;{job.name ?? job.id}&rdquo;?
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: '#2a2a4a', color: '#94a3b8' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteJob(String(job.id ?? job.name))}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: '#7f1d1d', color: 'white' }}
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create new job modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md"
            style={{ background: '#1a1a2e', border: '1px solid #2a2a4a' }}
          >
            <h2 className="text-lg font-bold mb-4 text-white">Create New Cron Job</h2>

            <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Job Name</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none"
              style={{ background: '#0a0a0a', border: '1px solid #2a2a4a', color: '#f1f5f9' }}
              placeholder="my-job"
              value={newJob.name}
              onChange={(e) => setNewJob((j) => ({ ...j, name: e.target.value }))}
            />

            <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Schedule (cron expression)</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none font-mono"
              style={{ background: '#0a0a0a', border: '1px solid #2a2a4a', color: '#f1f5f9' }}
              placeholder="*/30 * * * *"
              value={newJob.schedule}
              onChange={(e) => setNewJob((j) => ({ ...j, schedule: e.target.value }))}
            />

            <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Payload / Message</label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-sm mb-6 outline-none resize-none"
              style={{ background: '#0a0a0a', border: '1px solid #2a2a4a', color: '#f1f5f9' }}
              rows={3}
              placeholder="Message to send to agent..."
              value={newJob.payload}
              onChange={(e) => setNewJob((j) => ({ ...j, payload: e.target.value }))}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#2a2a4a', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button
                onClick={createJob}
                disabled={!newJob.name || !newJob.schedule}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: newJob.name && newJob.schedule ? '#3b82f6' : '#1e2a3a',
                  color: newJob.name && newJob.schedule ? 'white' : '#6b7280',
                }}
              >
                Create Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
