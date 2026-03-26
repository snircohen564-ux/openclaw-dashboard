'use client'

import { useState, useEffect } from 'react'
import { getGatewayUrl, getGatewayToken } from '@/lib/config'

interface Skill {
  name: string
  description: string
  location: string
  status: 'installed' | 'needs-setup' | 'unknown'
  global: boolean
}

// Hardcoded known skills from workspace
const KNOWN_SKILLS: Skill[] = [
  { name: 'notion', description: 'Notion API for creating and managing pages, databases, and blocks.', location: 'skills/notion', status: 'installed', global: false },
  { name: 'agentmail', description: 'API-first email platform designed for AI agents.', location: 'skills/agentmail', status: 'installed', global: false },
  { name: 'audit-website', description: 'Audit websites for SEO, performance, security with 230+ rules.', location: 'skills/audit-website', status: 'installed', global: false },
  { name: 'automation-workflows', description: 'Design and implement automation workflows.', location: 'skills/automation-workflows', status: 'installed', global: false },
  { name: 'brave-search', description: 'Web search and content extraction via Brave Search API.', location: 'skills/brave-search', status: 'installed', global: false },
  { name: 'business-ops', description: 'Business operations toolkit for running an agency.', location: 'skills/business-ops', status: 'installed', global: false },
  { name: 'coding-toolkit', description: 'Full-stack web development toolkit for building websites and apps.', location: 'skills/coding-toolkit', status: 'installed', global: false },
  { name: 'cron-mastery', description: "Master OpenClaw's timing systems.", location: 'skills/cron-mastery', status: 'installed', global: false },
  { name: 'data-analysis', description: 'Turn raw data into decisions with statistical rigor.', location: 'skills/data-analysis', status: 'installed', global: false },
  { name: 'data-analyst', description: 'Data visualization, report generation, SQL queries.', location: 'skills/data-analyst', status: 'installed', global: false },
  { name: 'deep-research-pro', description: 'Multi-source deep research agent. No API keys required.', location: 'skills/deep-research-pro', status: 'installed', global: false },
  { name: 'excel-xlsx', description: 'Read, write, and generate Excel files.', location: 'skills/excel-xlsx', status: 'installed', global: false },
  { name: 'fathom-api', description: 'Fathom API integration. Access meeting recordings and transcripts.', location: 'skills/fathom-api', status: 'installed', global: false },
  { name: 'find-skills', description: 'Helps users discover and install agent skills.', location: 'skills/find-skills', status: 'installed', global: false },
  { name: 'google-analytics', description: 'Google Analytics API integration with managed OAuth.', location: 'skills/google-analytics', status: 'installed', global: false },
  { name: 'humanizer', description: 'Remove signs of AI-generated writing from text.', location: 'skills/humanizer', status: 'installed', global: false },
  { name: 'markdown-converter', description: 'Convert documents and files to Markdown using markitdown.', location: 'skills/markdown-converter', status: 'installed', global: false },
  { name: 'marketing-skills', description: '34 marketing modules: full content pipeline.', location: 'skills/marketing-skills', status: 'installed', global: false },
  { name: 'multi-search-engine', description: 'Multi search engine integration with 17 engines.', location: 'skills/multi-search-engine', status: 'installed', global: false },
  { name: 'nano-banana-pro', description: 'Generate/edit images with Nano Banana Pro (Gemini 3 Pro Image).', location: 'skills/nano-banana-pro', status: 'installed', global: false },
  { name: 'news-summary', description: 'Fetches news from trusted RSS feeds and creates voice summaries.', location: 'skills/news-summary', status: 'installed', global: false },
  { name: 'openclaw-backup', description: 'Backup and restore OpenClaw data.', location: 'skills/openclaw-backup', status: 'installed', global: false },
  { name: 'openclaw-skill-vetter', description: 'Security vetting protocol before installing any AI agent skill.', location: 'skills/openclaw-skill-vetter', status: 'installed', global: false },
  { name: 'playwright-scraper-skill', description: 'Playwright-based web scraping with anti-bot protection.', location: 'skills/playwright-scraper-skill', status: 'installed', global: false },
  { name: 'productivity', description: 'Plan, focus, and complete work with energy management.', location: 'skills/productivity', status: 'installed', global: false },
  { name: 'self-improving-agent', description: 'Captures learnings, errors, and corrections for continuous improvement.', location: 'skills/self-improving-agent', status: 'installed', global: false },
  { name: 'superdesign', description: 'Expert frontend design guidelines for creating beautiful UIs.', location: 'skills/superdesign', status: 'installed', global: false },
  { name: 'todoist', description: 'Manage tasks and projects in Todoist.', location: 'skills/todoist', status: 'installed', global: false },
  { name: 'ui-ux-pro-max', description: 'UI/UX design intelligence and implementation guidance.', location: 'skills/ui-ux-pro-max', status: 'installed', global: false },
  { name: 'word-docx', description: 'Create, inspect, and edit Microsoft Word documents.', location: 'skills/word-docx', status: 'installed', global: false },
  { name: 'youtube-transcript', description: 'Fetch and summarize YouTube video transcripts.', location: 'skills/youtube-transcript', status: 'installed', global: false },
]

const GLOBAL_SKILLS: Skill[] = [
  { name: 'clawhub', description: 'Search, install, update, and publish agent skills from clawhub.com.', location: 'global/clawhub', status: 'installed', global: true },
  { name: 'gog', description: 'Google Workspace CLI for Gmail, Calendar, Drive, Contacts, Sheets, and Docs.', location: 'global/gog', status: 'installed', global: true },
  { name: 'healthcheck', description: 'Host security hardening and risk-tolerance configuration.', location: 'global/healthcheck', status: 'installed', global: true },
  { name: 'himalaya', description: 'CLI to manage emails via IMAP/SMTP.', location: 'global/himalaya', status: 'installed', global: true },
  { name: 'node-connect', description: 'Diagnose OpenClaw node connection and pairing failures.', location: 'global/node-connect', status: 'installed', global: true },
  { name: 'openai-whisper', description: 'Local speech-to-text with the Whisper CLI (no API key).', location: 'global/openai-whisper', status: 'installed', global: true },
  { name: 'skill-creator', description: 'Create, edit, improve, or audit AgentSkills.', location: 'global/skill-creator', status: 'installed', global: true },
  { name: 'video-frames', description: 'Extract frames or short clips from videos using ffmpeg.', location: 'global/video-frames', status: 'installed', global: true },
  { name: 'weather', description: 'Get current weather and forecasts via wttr.in or Open-Meteo.', location: 'global/weather', status: 'installed', global: true },
]

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([...GLOBAL_SKILLS, ...KNOWN_SKILLS])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'global' | 'workspace'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSkillsFromGateway()
  }, [])

  async function fetchSkillsFromGateway() {
    setLoading(true)
    try {
      const base = getGatewayUrl()
      const token = getGatewayToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${base}/tools/invoke`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'exec',
          args: { command: 'ls /data/.openclaw/workspace/skills/' },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const output: string = data?.output ?? data?.result ?? data?.stdout ?? ''
        if (output) {
          const dirs = output.trim().split('\n').filter(Boolean)
          const fetched: Skill[] = dirs.map((name) => {
            const existing = KNOWN_SKILLS.find((s) => s.name === name)
            return (
              existing ?? {
                name,
                description: 'Skill installed in workspace',
                location: `skills/${name}`,
                status: 'installed' as const,
                global: false,
              }
            )
          })
          // Merge: global + fetched workspace
          setSkills([...GLOBAL_SKILLS, ...fetched])
        }
      }
    } catch {
      // silently fallback to static list
    } finally {
      setLoading(false)
    }
  }

  const filtered = skills.filter((s) => {
    if (filter === 'global' && !s.global) return false
    if (filter === 'workspace' && s.global) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
      !s.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const workspaceCount = skills.filter((s) => !s.global).length
  const globalCount = skills.filter((s) => s.global).length

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Skills Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            {globalCount} global · {workspaceCount} workspace skills installed
          </p>
        </div>
        <button
          onClick={fetchSkillsFromGateway}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#94a3b8' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1 rounded-lg p-1" style={{ background: '#1a1a2e', border: '1px solid #2a2a4a' }}>
          {(['all', 'global', 'workspace'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-md text-sm capitalize transition-colors"
              style={{
                background: filter === f ? '#3b82f6' : 'transparent',
                color: filter === f ? 'white' : '#94a3b8',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          className="rounded-lg px-3 py-2 text-sm outline-none flex-1 max-w-xs"
          style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#f1f5f9' }}
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-center py-8" style={{ color: '#6b7280' }}>
          Loading skills...
        </div>
      )}

      {error && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: '#2d1a1a', border: '1px solid #7f1d1d', color: '#fca5a5' }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((skill) => (
          <div
            key={skill.location}
            className="rounded-xl p-4 transition-colors"
            style={{ background: '#1a1a2e', border: '1px solid #2a2a4a' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{skill.global ? '🌐' : '🧩'}</span>
                <span className="font-medium text-white text-sm">{skill.name}</span>
              </div>
              <div className="flex gap-1">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={
                    skill.global
                      ? { background: '#1a2e1a', color: '#4ade80' }
                      : { background: '#1e2a3a', color: '#60a5fa' }
                  }
                >
                  {skill.global ? 'global' : 'workspace'}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={
                    skill.status === 'installed'
                      ? { background: '#1a3a1a', color: '#4ade80' }
                      : { background: '#3a2a1a', color: '#fb923c' }
                  }
                >
                  {skill.status}
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
              {skill.description}
            </p>
            <div className="mt-3 text-xs font-mono" style={{ color: '#4a4a6a' }}>
              {skill.location}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12" style={{ color: '#6b7280' }}>
          No skills match your filter.
        </div>
      )}
    </div>
  )
}
