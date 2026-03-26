'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AGENTS, getGatewayUrl, getGatewayToken } from '@/lib/config'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export default function ChatPage() {
  const [activeAgentId, setActiveAgentId] = useState('main')
  const [chats, setChats] = useState<Record<string, Message[]>>({})
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const messages = chats[activeAgentId] ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, activeAgentId])

  const agent = AGENTS.find((a) => a.id === activeAgentId)!

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    setError(null)

    const userMsg: Message = { role: 'user', content: text }
    const updatedMessages = [...(chats[activeAgentId] ?? []), userMsg]

    setChats((prev) => ({
      ...prev,
      [activeAgentId]: updatedMessages,
    }))

    setStreaming(true)
    const ab = new AbortController()
    abortRef.current = ab

    // Add empty assistant message
    setChats((prev) => ({
      ...prev,
      [activeAgentId]: [
        ...(prev[activeAgentId] ?? []),
        { role: 'assistant', content: '', streaming: true },
      ],
    }))

    try {
      const base = getGatewayUrl()
      const token = getGatewayToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': activeAgentId,
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers,
        signal: ab.signal,
        body: JSON.stringify({
          model: `openclaw:${activeAgentId}`,
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          stream: true,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API error ${res.status}: ${errText}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const json = JSON.parse(data)
            const delta = json?.choices?.[0]?.delta?.content
            if (delta) {
              setChats((prev) => {
                const msgs = [...(prev[activeAgentId] ?? [])]
                const last = msgs[msgs.length - 1]
                if (last?.role === 'assistant') {
                  msgs[msgs.length - 1] = {
                    ...last,
                    content: last.content + delta,
                  }
                }
                return { ...prev, [activeAgentId]: msgs }
              })
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
        // Remove the empty streaming message
        setChats((prev) => {
          const msgs = [...(prev[activeAgentId] ?? [])]
          if (msgs[msgs.length - 1]?.streaming) msgs.pop()
          return { ...prev, [activeAgentId]: msgs }
        })
      }
    } finally {
      // Mark streaming done
      setChats((prev) => {
        const msgs = [...(prev[activeAgentId] ?? [])]
        const last = msgs[msgs.length - 1]
        if (last?.streaming) {
          msgs[msgs.length - 1] = { ...last, streaming: false }
        }
        return { ...prev, [activeAgentId]: msgs }
      })
      setStreaming(false)
    }
  }, [input, streaming, activeAgentId, chats])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setChats((prev) => ({ ...prev, [activeAgentId]: [] }))
  }

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 53px)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: '#0f0f1a', borderColor: '#2a2a4a' }}
      >
        <div className="p-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>
            Agents
          </p>
        </div>
        <div className="flex-1 px-2 pb-4 space-y-1">
          {AGENTS.map((a) => {
            const active = a.id === activeAgentId
            const hasMessages = (chats[a.id]?.length ?? 0) > 0
            return (
              <button
                key={a.id}
                onClick={() => setActiveAgentId(a.id)}
                className="w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors"
                style={{
                  background: active ? '#1e3a5f' : 'transparent',
                  border: active ? '1px solid #1e4a7a' : '1px solid transparent',
                }}
              >
                <span className="text-xl mt-0.5">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: active ? '#3b82f6' : '#f1f5f9' }}
                  >
                    {a.name}
                    {hasMessages && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blue-400 align-middle" />
                    )}
                  </div>
                  <div className="text-xs truncate" style={{ color: '#6b7280' }}>
                    {a.model}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ background: '#0f0f1a', borderColor: '#2a2a4a' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{agent.emoji}</span>
            <div>
              <span className="font-semibold text-white">{agent.name}</span>
              <span className="ml-2 text-xs" style={{ color: '#6b7280' }}>
                {agent.model}
              </span>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#6b7280', background: '#1a1a2e', border: '1px solid #2a2a4a' }}
          >
            Clear chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#6b7280' }}>
              <span className="text-5xl">{agent.emoji}</span>
              <p className="text-lg font-medium" style={{ color: '#94a3b8' }}>
                Chat with {agent.name}
              </p>
              <p className="text-sm">{agent.description}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <span className="text-lg mr-2 mt-1 flex-shrink-0">{agent.emoji}</span>
              )}
              <div
                className="max-w-[75%] rounded-2xl px-4 py-3 text-sm"
                style={
                  msg.role === 'user'
                    ? { background: '#1e3a5f', color: '#f1f5f9', borderBottomRightRadius: 4 }
                    : { background: '#1a1a2e', color: '#e2e8f0', borderBottomLeftRadius: 4, border: '1px solid #2a2a4a' }
                }
              >
                {msg.role === 'user' ? (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                ) : (
                  <div className="prose-chat">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom animate-pulse bg-blue-400 rounded-sm" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: '#2d1a1a', border: '1px solid #7f1d1d', color: '#fca5a5' }}
            >
              <strong>Error:</strong> {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 underline text-xs"
                style={{ color: '#fca5a5' }}
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="px-5 py-4 border-t"
          style={{ background: '#0f0f1a', borderColor: '#2a2a4a' }}
        >
          <div
            className="flex items-end gap-3 rounded-xl px-4 py-2"
            style={{ background: '#1a1a2e', border: '1px solid #2a2a4a' }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm py-1.5"
              style={{ color: '#f1f5f9', maxHeight: 160, lineHeight: 1.5 }}
              placeholder={`Message ${agent.name}... (Enter to send, Shift+Enter for newline)`}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
              }}
              onKeyDown={handleKeyDown}
              disabled={streaming}
            />
            <button
              onClick={streaming ? () => abortRef.current?.abort() : sendMessage}
              disabled={!streaming && !input.trim()}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors mb-0.5"
              style={{
                background: streaming ? '#7f1d1d' : input.trim() ? '#3b82f6' : '#2a2a4a',
                color: 'white',
              }}
              title={streaming ? 'Stop' : 'Send'}
            >
              {streaming ? '■' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
