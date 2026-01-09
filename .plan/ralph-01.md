Create a dashboard UI for managing multiple Claude Agent SDK sessions.

## Context
- Existing project: `loop-agent/` - a TypeScript coding agent using @anthropic-ai/claude-agent-sdk
- New project: `loop-agent-ui/` - Next.js dashboard in the parent folder

## Tech Stack
- Next.js (App Router)
- shadcn/ui components
- WebSocket for real-time agent streaming
- Postgres for session storage
- Docker for Railway deployment

## Architecture (POC Phase)
- Single API server managing multiple SDK sessions
- Each session uses SDK's built-in session_id + resume for context
- Isolated working directories per session (cwd option)
- Secrets stay at API level (not accessible to agent)
- Restricted allowedTools per session

## UI Requirements
- Left sidebar: list of sessions (create new, select existing)
- Main area: chat interface showing agent messages and tool usage
- Real-time streaming of agent responses
- Session metadata: name, created date, status, cost tracking
- Clean, minimal design

## API Endpoints
- POST /api/sessions - create new session
- GET /api/sessions - list all sessions
- GET /api/sessions/:id - get session details
- POST /api/sessions/:id/message - send message (returns WebSocket upgrade for streaming)
- DELETE /api/sessions/:id - end session

## Security
- API proxies authentication (agent never sees API keys)
- Working directory isolation per session
- Restricted tool access (no parent directory access)

Start by setting up the Next.js project with shadcn/ui, then create the dashboard layout with sidebar and chat interface.
