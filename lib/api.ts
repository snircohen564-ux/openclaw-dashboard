import { getGatewayUrl, getGatewayToken } from './config'

export function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = getGatewayToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

export async function invokeToolRaw(tool: string, args: Record<string, unknown>): Promise<unknown> {
  const base = getGatewayUrl()
  const res = await fetch(`${base}/tools/invoke`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ tool, args }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tool ${tool} failed (${res.status}): ${text}`)
  }
  return res.json()
}

// SSE chat streaming — returns an async generator of text chunks
export async function* streamChat(
  agentId: string,
  messages: { role: string; content: string }[],
  sessionKey?: string
): AsyncGenerator<string> {
  const base = getGatewayUrl()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-openclaw-agent-id': agentId,
  }
  const token = getGatewayToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (sessionKey) headers['x-openclaw-session-key'] = sessionKey

  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: `openclaw:${agentId}`,
      messages,
      stream: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chat failed (${res.status}): ${text}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const delta = json?.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // skip malformed
      }
    }
  }
}
