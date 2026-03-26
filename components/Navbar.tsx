'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/agents', label: 'Agents', icon: '🤖' },
  { href: '/skills', label: 'Skills', icon: '🧩' },
  { href: '/cron', label: 'Cron', icon: '⏰' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [showSettings, setShowSettings] = useState(false)
  const [gatewayUrl, setGatewayUrl] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    setGatewayUrl(localStorage.getItem('openclaw_gateway_url') || '')
    setToken(localStorage.getItem('openclaw_gateway_token') || '')
  }, [])

  function saveSettings() {
    if (gatewayUrl) localStorage.setItem('openclaw_gateway_url', gatewayUrl)
    else localStorage.removeItem('openclaw_gateway_url')
    if (token) localStorage.setItem('openclaw_gateway_token', token)
    else localStorage.removeItem('openclaw_gateway_token')
    setShowSettings(false)
    window.location.reload()
  }

  return (
    <>
      <nav
        className="flex items-center gap-1 px-4 py-3 border-b"
        style={{ background: '#0f0f1a', borderColor: '#2a2a4a' }}
      >
        <Link href="/chat" className="flex items-center gap-2 mr-6 font-bold text-lg no-underline">
          <span className="text-2xl">🦀</span>
          <span style={{ color: '#3b82f6' }}>OpenClaw</span>
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors no-underline"
                style={{
                  background: active ? '#1e3a5f' : 'transparent',
                  color: active ? '#3b82f6' : '#94a3b8',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
          style={{ color: '#94a3b8', background: 'transparent' }}
          title="Configure gateway"
        >
          ⚙️ Settings
        </button>
      </nav>

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md"
            style={{ background: '#1a1a2e', border: '1px solid #2a2a4a' }}
          >
            <h2 className="text-lg font-bold mb-4 text-white">Gateway Settings</h2>

            <label className="block text-sm mb-1" style={{ color: '#94a3b8' }}>
              Gateway URL
            </label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:ring-1"
              style={{
                background: '#0a0a0a',
                border: '1px solid #2a2a4a',
                color: '#f1f5f9',
                // focus ring handled by className
              }}
              placeholder="https://srv1410211.tailaf8b3a.ts.net"
              value={gatewayUrl}
              onChange={(e) => setGatewayUrl(e.target.value)}
            />

            <label className="block text-sm mb-1" style={{ color: '#94a3b8' }}>
              Bearer Token
            </label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm mb-6 outline-none"
              type="password"
              style={{ background: '#0a0a0a', border: '1px solid #2a2a4a', color: '#f1f5f9' }}
              placeholder="your-token-here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#2a2a4a', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#3b82f6', color: 'white' }}
              >
                Save & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
