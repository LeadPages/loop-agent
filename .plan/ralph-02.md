# Phase 2: Connect Real Claude Agent SDK to Dashboard

## Current State

- `loop-agent/` - Working CLI agent using @anthropic-ai/claude-agent-sdk
- `loop-agent-ui/` - Dashboard with mock API responses, SSE streaming structure in place

## Goal

Replace mock responses with real Claude Agent SDK integration. Sessions should persist, resume, and run in isolated working directories.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  loop-agent-ui (Railway Container)                              │
│                                                                 │
│  ┌─────────────┐     ┌────────────────────────────────────────┐ │
│  │   Next.js   │────►│  /api/sessions/[id]/message            │ │
│  │   Frontend  │ SSE │                                        │ │
│  └─────────────┘     │  ┌──────────────────────────────────┐  │ │
│                      │  │  AgentRunner                     │  │ │
│                      │  │  - SDK query() per session       │  │ │
│                      │  │  - Async generator → SSE stream  │  │ │
│                      │  │  - Session resumption via SDK    │  │ │
│                      │  └──────────────────────────────────┘  │ │
│                      └────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────┐     ┌────────────────────────────────────────┐ │
│  │   SQLite    │     │  /tmp/loop-agent-workspaces/           │ │
│  │   sessions  │     │  ├── {session-1}/                      │ │
│  │   messages  │     │  ├── {session-2}/                      │ │
│  └─────────────┘     │  └── {session-n}/                      │ │
│                      └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### 1. Install SDK and Dependencies

```bash
cd loop-agent-ui
npm install @anthropic-ai/claude-agent-sdk better-sqlite3
npm install -D @types/better-sqlite3
```

### 2. Create Agent Runner Module

`src/lib/agent-runner.ts`:
- Wrap SDK `query()` function
- Convert async generator to SSE-compatible stream
- Handle session creation and resumption
- Manage working directory per session
- Extract session_id from init message for resumption

Key implementation:
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

export async function* runAgent(sessionId: string, prompt: string, sdkSessionId?: string) {
  const cwd = `/tmp/loop-agent-workspaces/${sessionId}`;

  for await (const message of query({
    prompt,
    options: {
      cwd,
      resume: sdkSessionId, // Resume if we have a previous session
      allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      systemPrompt: "You are a coding assistant...",
    },
  })) {
    yield message; // Yield each message for SSE streaming
  }
}
```

### 3. Database Schema (SQLite)

`src/lib/db.ts`:
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sdk_session_id TEXT,
  cwd TEXT NOT NULL,
  status TEXT DEFAULT 'idle',
  cost_usd REAL DEFAULT 0,
  turns INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'user' | 'assistant' | 'tool' | 'system'
  content TEXT NOT NULL,
  tool_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

### 4. Update API Route

`src/app/api/sessions/[id]/message/route.ts`:
- Create workspace directory if not exists
- Call agent runner with prompt
- Stream SDK messages as SSE events
- Update session with sdk_session_id after init
- Store messages in database
- Update cost/turns on result

### 5. Working Directory Management

`src/lib/workspace.ts`:
- `createWorkspace(sessionId)` - Create `/tmp/loop-agent-workspaces/{id}/`
- `deleteWorkspace(sessionId)` - Clean up on session delete
- `initializeWorkspace(sessionId, template?)` - Optional: clone a repo or copy starter files

### 6. Session Resumption Flow

```
User sends message
        │
        ▼
Check DB for sdk_session_id
        │
        ├── Has sdk_session_id? ──► query({ resume: sdk_session_id })
        │
        └── No sdk_session_id? ──► query({ prompt })
                                         │
                                         ▼
                                   On 'system' init message:
                                   Save sdk_session_id to DB
```

### 7. Update Dockerfile

Add Claude Code CLI to container:
```dockerfile
FROM node:20-alpine AS base

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# ... rest of Dockerfile
```

### 8. Environment Variables

Railway config:
```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=file:./data/sessions.db
WORKSPACE_ROOT=/tmp/loop-agent-workspaces
```

### 9. Error Handling

- SDK process crashes → Return error message, mark session as error state
- Auth failures → Return 401, prompt user to check API key
- Timeout → Graceful abort, allow retry
- Connection drop → Client reconnects, resumes from last message

### 10. Testing Checklist

- [ ] Create new session → workspace created
- [ ] Send message → real SDK response streams
- [ ] Send follow-up → session resumes correctly
- [ ] Reload page → messages persist from DB
- [ ] Delete session → workspace cleaned up
- [ ] Docker build works
- [ ] Railway deployment works

---

## File Changes Summary

**New files:**
- `src/lib/agent-runner.ts` - SDK wrapper with streaming
- `src/lib/db.ts` - SQLite database setup and queries
- `src/lib/workspace.ts` - Working directory management

**Modified files:**
- `src/lib/agent.ts` - Use database instead of in-memory Map
- `src/app/api/sessions/[id]/message/route.ts` - Real SDK integration
- `src/app/api/sessions/route.ts` - Database queries
- `src/app/api/sessions/[id]/route.ts` - Database queries + workspace cleanup
- `Dockerfile` - Add Claude Code CLI
- `package.json` - Add dependencies

---

## Security Considerations

1. **API Key Isolation**: ANTHROPIC_API_KEY only in env vars, never passed to agent
2. **Path Restriction**: Agent's `cwd` is isolated workspace, use `additionalDirectories: []`
3. **Tool Restriction**: Explicitly list `allowedTools`, no access to dangerous tools
4. **No .env Access**: Workspace directories don't contain .env files

---

## Future Phases (Out of Scope)

- Phase 3: Container-per-session for full isolation
- Phase 4: Multi-user authentication
- Phase 5: Git repo cloning into workspaces
- Phase 6: Real-time collaboration (multiple viewers)
