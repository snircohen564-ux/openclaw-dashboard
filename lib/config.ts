export const AGENTS = [
  {
    id: 'main',
    name: 'Jarvis',
    emoji: '🔧',
    model: 'Claude Haiku 4.5',
    description: 'Main orchestrator agent',
    workspace: '/data/.openclaw/workspace',
  },
  {
    id: 'business',
    name: 'Business',
    emoji: '💼',
    model: 'Claude Haiku 4.5',
    description: 'Business operations & strategy',
    workspace: '/data/.openclaw/workspace',
  },
  {
    id: 'content',
    name: 'Content',
    emoji: '🎬',
    model: 'Claude Haiku 4.5',
    description: 'Content creation & marketing',
    workspace: '/data/.openclaw/workspace',
  },
  {
    id: 'fitness',
    name: 'Fitness',
    emoji: '💪',
    model: 'Claude Haiku 4.5',
    description: 'Health & fitness coaching',
    workspace: '/data/.openclaw/workspace',
  },
  {
    id: 'improvement',
    name: 'Improvement',
    emoji: '⚙️',
    model: 'Claude Opus 4.6',
    description: 'Self-improvement & learning',
    workspace: '/data/.openclaw/workspace',
  },
  {
    id: 'glow',
    name: 'Lookmaxing',
    emoji: '🪞',
    model: 'Claude Sonnet 4.6',
    description: 'Appearance & style optimization',
    workspace: '/data/.openclaw/workspace',
  },
]

export function getAgent(id: string) {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0]
}

export function getGatewayUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('openclaw_gateway_url')
    if (stored) return stored
  }
  return process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://srv1410211.tailaf8b3a.ts.net'
}

export function getGatewayToken(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('openclaw_gateway_token')
    if (stored) return stored
  }
  return process.env.NEXT_PUBLIC_GATEWAY_TOKEN || ''
}
