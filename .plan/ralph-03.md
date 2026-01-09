# Phase 3: Multi-Agent Support

## Current State

- Single hardcoded agent configuration in `agent-runner.ts`
- All sessions use the same system prompt, tools, and permissions
- No way to select different agent "personalities" or capabilities

## Goal

Allow users to create and select from multiple agent configurations. Each agent has its own name, system prompt, allowed tools, and restrictions. Sessions are tied to a specific agent.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Agent Registry                                                 │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  loop-agent     │  │  loop-agent-copy│  │  custom-agent   │ │
│  │  (unrestricted) │  │  (restricted)   │  │  (user-defined) │ │
│  │                 │  │                 │  │                 │ │
│  │  Tools: ALL     │  │  Tools: Read,   │  │  Tools: ...     │ │
│  │  Bash: Yes      │  │  Write, Edit    │  │  Prompt: ...    │ │
│  │  Dirs: /        │  │  Bash: No       │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Session                                                        │
│  - agent_id: "loop-agent-copy"                                  │
│  - Inherits agent config when running                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Agent Configuration

```typescript
interface AgentConfig {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // What this agent does
  systemPrompt: string;          // Custom system prompt
  allowedTools: string[];        // Tool whitelist
  disallowedTools?: string[];    // Tool blacklist (alternative)
  allowBash: boolean;            // Explicit Bash control
  restrictToWorkspace: boolean;  // Try to restrict to session workspace
  additionalDirectories?: string[]; // Extra allowed paths
  model?: string;                // Override model (future)
  maxTurns?: number;             // Safety limit
  icon?: string;                 // UI icon
  color?: string;                // UI accent color
}
```

### Database Schema Addition

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  allowed_tools TEXT NOT NULL,  -- JSON array
  allow_bash INTEGER DEFAULT 0,
  restrict_to_workspace INTEGER DEFAULT 1,
  additional_directories TEXT,  -- JSON array
  icon TEXT,
  color TEXT,
  is_builtin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Add agent_id to sessions
ALTER TABLE sessions ADD COLUMN agent_id TEXT REFERENCES agents(id);
```

---

## Built-in Agents

### 1. loop-agent (Power User)
```typescript
{
  id: "loop-agent",
  name: "Loop Agent",
  description: "Full access coding agent - use with caution",
  systemPrompt: "You are a coding assistant with full system access...",
  allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  allowBash: true,
  restrictToWorkspace: false,
  icon: "terminal",
  color: "red"
}
```

### 2. loop-agent-copy (Restricted)
```typescript
{
  id: "loop-agent-copy",
  name: "Loop Agent (Safe)",
  description: "Restricted to workspace - no shell access",
  systemPrompt: "You are a coding assistant named 'Loop Agent Safe'. You can only access files within your workspace directory. You cannot run shell commands...",
  allowedTools: ["Read", "Write", "Edit", "Glob", "Grep"],
  allowBash: false,
  restrictToWorkspace: true,
  icon: "shield",
  color: "green"
}
```

---

## Implementation Steps

### 1. Create Agent Registry Module

`src/lib/agents.ts`:
- Define `AgentConfig` interface
- Create built-in agent configurations
- Functions: `getAgent()`, `listAgents()`, `createAgent()`, `updateAgent()`

### 2. Update Database Schema

`src/lib/db.ts`:
- Add `agents` table
- Add `agent_id` column to `sessions` table
- Seed built-in agents on startup

### 3. Update Agent Runner

`src/lib/agent-runner.ts`:
- Accept `AgentConfig` parameter
- Apply agent-specific settings to SDK query
- Include agent name in system prompt

### 4. Update API Routes

**New routes:**
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create custom agent (future)

**Modified routes:**
- `POST /api/sessions` - Accept `agent_id` parameter
- `GET /api/sessions/:id` - Include agent info in response

### 5. Update UI Components

**Sidebar changes:**
- Add agent selector dropdown above session list
- Show agent icon/color on sessions
- Filter sessions by selected agent (optional)

**New session flow:**
- Show agent picker when creating session
- Display current agent in chat header

**New component:**
- `AgentSelector` - Dropdown to pick agent

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────┐                                           │
│  │ Agent: [▼ Loop Agent (Safe)]                                │
│  └──────────────────┘                                           │
│  Sessions                                              [+ New]  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🟢 Session 1                              $0.0012 · 3 turns ││
│  │ 🟢 Session 2                              $0.0008 · 2 turns ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Loop Agent Dashboard                                           │
└─────────────────────────────────────────────────────────────────┘

Chat Header:
┌─────────────────────────────────────────────────────────────────┐
│  Session 1                          🛡️ Loop Agent (Safe)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Changes Summary

**New files:**
- `src/lib/agents.ts` - Agent configuration registry
- `src/app/api/agents/route.ts` - List agents API
- `src/components/dashboard/agent-selector.tsx` - UI component

**Modified files:**
- `src/lib/db.ts` - Add agents table, update sessions
- `src/lib/agent-runner.ts` - Use agent config
- `src/lib/agent.ts` - Include agent_id in session
- `src/app/api/sessions/route.ts` - Accept agent_id
- `src/app/api/sessions/[id]/route.ts` - Return agent info
- `src/components/dashboard/sidebar.tsx` - Add agent selector
- `src/components/dashboard/chat.tsx` - Show agent in header
- `src/app/page.tsx` - Manage agent selection state

---

## Security Notes

Even with `restrictToWorkspace: true`, the SDK doesn't enforce hard boundaries. This is "best effort" restriction:

1. **No Bash** = Can't `cd` or run arbitrary commands
2. **cwd set** = SDK operations default to workspace
3. **additionalDirectories: []** = Hint to SDK to restrict paths

For true multi-tenant security, Phase 4 should implement container-per-session isolation.

---

## Future Enhancements (Out of Scope)

- Custom agent creation UI
- Agent templates/presets
- Per-agent API key configuration
- Agent usage analytics
- Agent sharing between users
