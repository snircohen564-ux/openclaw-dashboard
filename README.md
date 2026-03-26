# OpenClaw Dashboard

A Next.js 14 dashboard for managing OpenClaw AI agents.

## Features

- **Chat** — Real-time streaming chat with any agent via SSE
- **Agents** — Visual hierarchy of all agents with session counts
- **Skills** — Browse all installed skills (global + workspace)
- **Cron** — Manage scheduled jobs (create, edit, toggle, delete)
- **Analytics** — Session stats, token usage, cost estimates

## Quick Setup

```bash
cd /data/.openclaw/workspace/openclaw-dashboard
bash setup.sh
```

## Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your gateway URL and token

# 3. Build
npm run build

# 4. Start
npm start
# or for development:
npm run dev
```

## Configuration

Edit `.env.local`:

```env
NEXT_PUBLIC_GATEWAY_URL=https://srv1410211.tailaf8b3a.ts.net
NEXT_PUBLIC_GATEWAY_TOKEN=your-bearer-token-here
```

You can also configure these at runtime via the **⚙️ Settings** button in the navbar — values are stored in localStorage and take precedence.

## Running

```bash
# Development (hot reload)
npm run dev
# → http://localhost:3000

# Production
npm run build && npm start
# → http://localhost:3000
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- react-markdown + remark-gfm

## Gateway API Used

| Endpoint | Purpose |
|---|---|
| `POST /v1/chat/completions` | SSE streaming chat |
| `POST /tools/invoke` | Invoke any OpenClaw tool |

Headers:
- `Authorization: Bearer <token>`
- `x-openclaw-agent-id: <agentId>`
- `x-openclaw-session-key: <sessionKey>` (optional)
