# Loop Agent - Architecture Overview

This document provides a comprehensive overview of how the Loop Agent system works, including all aspects of the Claude Agent SDK integration, session management, multi-agent orchestration, and data persistence.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Structure](#2-project-structure)
3. [Dependencies](#3-dependencies)
4. [Core SDK Integration](#4-core-sdk-integration)
5. [Agent Configuration](#5-agent-configuration)
6. [Session Management](#6-session-management)
7. [Agent Runner (Execution Engine)](#7-agent-runner-execution-engine)
8. [Multi-Agent Orchestration](#8-multi-agent-orchestration)
9. [Data Persistence](#9-data-persistence)
10. [Workspace Management](#10-workspace-management)
11. [API Layer](#11-api-layer)
12. [Message Flow](#12-message-flow)

---

## 1. Introduction

Loop Agent is a dual-layer application built on the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`). It provides:

- **CLI Agent**: A standalone command-line coding agent
- **Web UI**: A Next.js application with session management, multi-agent orchestration, and real-time streaming

The system leverages Claude's tool-use capabilities to perform file operations, run shell commands, and generate content autonomously.

---

## 2. Project Structure

```
loop-agent/
├── loop-agent/                    # Standalone CLI agent
│   ├── src/
│   │   └── index.ts              # CLI entry point
│   └── package.json
│
└── loop-agent-ui/                 # Web UI (Next.js)
    ├── src/
    │   ├── app/
    │   │   └── api/
    │   │       └── sessions/
    │   │           └── [id]/
    │   │               └── message/
    │   │                   └── route.ts    # SSE streaming endpoint
    │   └── lib/
    │       ├── agent.ts                    # Session management
    │       ├── agent-runner.ts             # SDK execution engine
    │       ├── agents.ts                   # Agent configuration registry
    │       ├── db.ts                       # SQLite database layer
    │       ├── workspace.ts                # File system workspace management
    │       └── landing-page/               # Multi-agent orchestration
    │           ├── index.ts                # Module exports
    │           ├── orchestrator.ts         # Main orchestrator
    │           ├── brand-kit-generator.ts  # Brand extraction
    │           ├── sdk-client.ts           # SDK wrapper for simple prompts
    │           └── agents/                 # Sub-agents
    │               ├── brand-analyst.ts
    │               ├── design-system.ts
    │               ├── content-planner.ts
    │               └── html-generator.ts
    └── package.json
```

---

## 3. Dependencies

### CLI Package ([loop-agent/package.json:20-22](loop-agent/package.json#L20-L22))

```json
{
  "@anthropic-ai/claude-agent-sdk": "^0.2.2"
}
```

### Web UI Package ([loop-agent-ui/package.json:12-13](loop-agent-ui/package.json#L12-L13))

```json
{
  "@anthropic-ai/claude-agent-sdk": "^0.2.2",
  "@anthropic-ai/sdk": "^0.71.2"
}
```

The UI uses both the Agent SDK (for agent orchestration) and the direct Anthropic SDK (for standalone API calls).

---

## 4. Core SDK Integration

### 4.1 The `query()` Function

The central SDK function is `query()`, imported from `@anthropic-ai/claude-agent-sdk`. It returns an async iterable that streams messages as the agent executes.

**CLI Example** ([loop-agent/src/index.ts:1](loop-agent/src/index.ts#L1), [35-44](loop-agent/src/index.ts#L35-L44)):

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt,
  options: {
    systemPrompt: SYSTEM_PROMPT,
    allowedTools: CODING_TOOLS,
  },
})) {
  // Handle message types: system, assistant, result
}
```

### 4.2 Message Types

The SDK yields three message types during execution:

| Type | Subtype | Description | Reference |
|------|---------|-------------|-----------|
| `system` | `init` | Session initialization with ID, model, tools | [loop-agent/src/index.ts:47-54](loop-agent/src/index.ts#L47-L54) |
| `assistant` | - | Claude's responses (text blocks, tool_use blocks) | [loop-agent/src/index.ts:56-65](loop-agent/src/index.ts#L56-L65) |
| `result` | `success` / `error_*` | Final result with cost, turns, or errors | [loop-agent/src/index.ts:67-80](loop-agent/src/index.ts#L67-L80) |

### 4.3 Available Tools

Tools are specified via `allowedTools` in the options:

**CLI Tools** ([loop-agent/src/index.ts:4-11](loop-agent/src/index.ts#L4-L11)):
```typescript
const CODING_TOOLS = [
  "Read",   // Read files
  "Write",  // Create new files
  "Edit",   // Edit existing files
  "Bash",   // Run shell commands
  "Glob",   // Find files by pattern
  "Grep",   // Search file contents
];
```

---

## 5. Agent Configuration

### 5.1 AgentConfig Interface

Agent configurations define behavior, tools, and visual properties.

**Definition** ([loop-agent-ui/src/lib/agents.ts:3-15](loop-agent-ui/src/lib/agents.ts#L3-L15)):

```typescript
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  allowBash: boolean;
  restrictToWorkspace: boolean;
  additionalDirectories?: string[];
  icon: string;
  color: string;
  isBuiltin: boolean;
}
```

### 5.2 Built-in Agents

The system includes one built-in agent for landing page generation.

**Landing Page Generator** ([loop-agent-ui/src/lib/agents.ts:18-51](loop-agent-ui/src/lib/agents.ts#L18-L51)):

| Property | Value |
|----------|-------|
| `id` | `landing-page-generator` |
| `allowedTools` | `["Read", "Write", "Edit", "Glob", "Grep"]` |
| `allowBash` | `false` |
| `restrictToWorkspace` | `true` |

### 5.3 Agent Lookup

**Functions** ([loop-agent-ui/src/lib/agents.ts:54-64](loop-agent-ui/src/lib/agents.ts#L54-L64)):

```typescript
export function getAgentConfig(id: string): AgentConfig | undefined;
export function listAgentConfigs(): AgentConfig[];
export const DEFAULT_AGENT_ID = "landing-page-generator";
```

---

## 6. Session Management

### 6.1 AgentSession Interface

Sessions track state, SDK session ID (for resumption), and usage metrics.

**Definition** ([loop-agent-ui/src/lib/agent.ts:8-18](loop-agent-ui/src/lib/agent.ts#L8-L18)):

```typescript
export interface AgentSession {
  id: string;
  name: string;
  agentId: string;
  sessionId: string | null;  // SDK session_id for resumption
  cwd: string;
  status: "idle" | "active" | "ended" | "error";
  createdAt: Date;
  costUsd: number;
  turns: number;
}
```

### 6.2 Session Operations

**CRUD Functions** ([loop-agent-ui/src/lib/agent.ts:35-74](loop-agent-ui/src/lib/agent.ts#L35-L74)):

| Function | Purpose |
|----------|---------|
| `createSession(id, name?, agentId?)` | Creates session with workspace |
| `getSession(id)` | Retrieves session by ID |
| `updateSession(id, updates)` | Updates name, status, cost, turns, SDK session ID |
| `deleteSession(id)` | Deletes session and workspace |
| `listSessions()` | Lists all sessions ordered by creation date |

### 6.3 Session Resumption

The SDK supports resuming previous sessions by passing the `resume` option with the SDK session ID.

**Resumption Logic** ([loop-agent-ui/src/lib/agent-runner.ts:72-75](loop-agent-ui/src/lib/agent-runner.ts#L72-L75)):

```typescript
if (sdkSessionId) {
  options.resume = sdkSessionId;
}
```

---

## 7. Agent Runner (Execution Engine)

The agent runner is the core execution engine that wraps the SDK and converts messages to SSE events.

### 7.1 SSE Event Types

**Definition** ([loop-agent-ui/src/lib/agent-runner.ts:11-22](loop-agent-ui/src/lib/agent-runner.ts#L11-L22)):

```typescript
export interface SSEEvent {
  type: "system" | "assistant" | "tool" | "result" | "error";
  content?: string;
  toolName?: string;
  sessionId?: string;
  model?: string;
  tools?: string[];
  costUsd?: number;
  turns?: number;
  result?: string;
  previewFile?: string;
}
```

### 7.2 runAgent Function

The main execution function is an async generator that yields SSE events.

**Signature** ([loop-agent-ui/src/lib/agent-runner.ts:27-33](loop-agent-ui/src/lib/agent-runner.ts#L27-L33)):

```typescript
export async function* runAgent(
  sessionId: string,
  prompt: string,
  agentId: string,
  sdkSessionId?: string,
  model?: string
): AsyncGenerator<SSEEvent>
```

### 7.3 SDK Options Configuration

**Options Building** ([loop-agent-ui/src/lib/agent-runner.ts:51-65](loop-agent-ui/src/lib/agent-runner.ts#L51-L65)):

```typescript
const options = {
  cwd,                                    // Workspace directory
  systemPrompt: agentConfig.systemPrompt, // From agent config
  allowedTools: agentConfig.allowedTools, // Tool restrictions
  permissionMode: "bypassPermissions",    // For automated workflows
  allowDangerouslySkipPermissions: true,
  model,                                  // Optional model override
};
```

### 7.4 Message Processing

The runner converts SDK messages to SSE events:

| SDK Message | SSE Event | Reference |
|-------------|-----------|-----------|
| `system` (init) | `system` with sessionId, model, tools | [agent-runner.ts:83-93](loop-agent-ui/src/lib/agent-runner.ts#L83-L93) |
| `assistant` (text) | `assistant` with content | [agent-runner.ts:95-103](loop-agent-ui/src/lib/agent-runner.ts#L95-L103) |
| `assistant` (tool_use) | `tool` with toolName, content | [agent-runner.ts:103-109](loop-agent-ui/src/lib/agent-runner.ts#L103-L109) |
| `result` (success) | `result` with cost, turns | [agent-runner.ts:113-121](loop-agent-ui/src/lib/agent-runner.ts#L113-L121) |
| `result` (error) | `error` with message | [agent-runner.ts:121-131](loop-agent-ui/src/lib/agent-runner.ts#L121-L131) |

---

## 8. Multi-Agent Orchestration

The landing page generator uses a multi-agent pipeline to transform unstructured text into HTML.

### 8.1 Pipeline Overview

```
User Input → Brand Kit Generator → Orchestrator Pipeline → HTML Output
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
             Brand Analyst      Design System         Content Planner
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         ▼
                                   HTML Generator
```

### 8.2 LandingPageOrchestrator Class

**Constructor** ([loop-agent-ui/src/lib/landing-page/orchestrator.ts:53-58](loop-agent-ui/src/lib/landing-page/orchestrator.ts#L53-L58)):

```typescript
constructor(options: OrchestratorOptions) {
  this.brandKit = options.brandKit;
  this.requirements = options.requirements;
  this.model = options.model || "claude-sonnet-4-5-20250929";
  this.maxAttempts = options.maxAttempts || 3;
}
```

### 8.3 Generation States

**State Enum** (from [orchestrator.ts:46](loop-agent-ui/src/lib/landing-page/orchestrator.ts#L46)):

| State | Description |
|-------|-------------|
| `init` | Starting generation |
| `analyzing_brand` | Extracting design tokens |
| `generating_design_system` | Creating utility classes (parallel with content planning) |
| `planning_content` | Structuring sections |
| `generating_html` | Building final HTML |
| `complete` | Generation finished |
| `error` | Generation failed |

### 8.4 Parallel Execution

Design system generation and content planning run in parallel for efficiency.

**Parallel Execution** ([loop-agent-ui/src/lib/landing-page/orchestrator.ts:97-100](loop-agent-ui/src/lib/landing-page/orchestrator.ts#L97-L100)):

```typescript
const [utilityClasses, contentStructure] = await Promise.all([
  this.runDesignSystem(),
  this.runContentPlanner(),
]);
```

### 8.5 Sub-Agents

#### Brand Analyst ([landing-page/agents/brand-analyst.ts](loop-agent-ui/src/lib/landing-page/agents/brand-analyst.ts))

- **Purpose**: Extracts design tokens from brand kit
- **Implementation**: Direct extraction (no API call) for efficiency
- **Function**: `extractDesignTokens(brandKit)` ([line 78-114](loop-agent-ui/src/lib/landing-page/agents/brand-analyst.ts#L78-L114))

#### Design System ([landing-page/agents/design-system.ts](loop-agent-ui/src/lib/landing-page/agents/design-system.ts))

- **Purpose**: Generates Tailwind utility classes
- **Implementation**: SDK call with fallback to defaults
- **Function**: `generateDesignSystem(designTokens, model)`

#### Content Planner ([landing-page/agents/content-planner.ts](loop-agent-ui/src/lib/landing-page/agents/content-planner.ts))

- **Purpose**: Plans page sections and content hierarchy
- **Implementation**: SDK call
- **Function**: `planContent(designTokens, requirements, model)`

#### HTML Generator ([landing-page/agents/html-generator.ts](loop-agent-ui/src/lib/landing-page/agents/html-generator.ts))

- **Purpose**: Builds HTML using only div, img, a, button elements
- **Constraints**: Element whitelist, Tailwind-only styling
- **Function**: `generateHtml(utilityClasses, contentStructure, brandKit, model)` ([line 411-429](loop-agent-ui/src/lib/landing-page/agents/html-generator.ts#L411-L429))

### 8.6 SDK Client Wrapper

For simple prompt/response calls without tools, a wrapper function is provided.

**sdkPrompt Function** ([loop-agent-ui/src/lib/landing-page/sdk-client.ts:123-185](loop-agent-ui/src/lib/landing-page/sdk-client.ts#L123-L185)):

```typescript
export async function sdkPrompt(
  userPrompt: string,
  options: PromptOptions,
  images?: ImageInput[]
): Promise<string>
```

Key options:
- `tools: []` - Disables all tools
- `persistSession: false` - Ephemeral sessions
- `maxTurns: 1` - Single turn only

### 8.7 Image Support

The SDK client supports multimodal prompts with images.

**buildContentBlocks** ([loop-agent-ui/src/lib/landing-page/sdk-client.ts:55-95](loop-agent-ui/src/lib/landing-page/sdk-client.ts#L55-L95)):

- Converts file paths to base64-encoded content blocks
- Supports JPEG, PNG, GIF, WebP
- Places images before text (Claude recommendation)

---

## 9. Data Persistence

### 9.1 Database Schema

SQLite database using `better-sqlite3` with WAL mode.

**Tables** ([loop-agent-ui/src/lib/db.ts:25-67](loop-agent-ui/src/lib/db.ts#L25-L67)):

#### sessions
| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PRIMARY KEY | Session UUID |
| `name` | TEXT | Display name |
| `agent_id` | TEXT | Agent configuration ID |
| `sdk_session_id` | TEXT | SDK session ID for resumption |
| `cwd` | TEXT | Workspace path |
| `status` | TEXT | idle, active, ended, error |
| `cost_usd` | REAL | Cumulative API cost |
| `turns` | INTEGER | Total agentic turns |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last update timestamp |

#### messages
| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PRIMARY KEY | Message UUID |
| `session_id` | TEXT | Foreign key to sessions |
| `type` | TEXT | user, assistant, tool |
| `content` | TEXT | Message content |
| `tool_name` | TEXT | Tool name (if type=tool) |
| `created_at` | TEXT | Timestamp |

#### attachments
| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PRIMARY KEY | Attachment UUID |
| `message_id` | TEXT | Foreign key to messages |
| `session_id` | TEXT | Foreign key to sessions |
| `filename` | TEXT | Original filename |
| `stored_path` | TEXT | Path in workspace |
| `mime_type` | TEXT | MIME type |
| `size_bytes` | INTEGER | File size |
| `analysis` | TEXT | AI-generated analysis |
| `created_at` | TEXT | Timestamp |

### 9.2 Database Operations

**Key Functions** ([loop-agent-ui/src/lib/db.ts:277-378](loop-agent-ui/src/lib/db.ts#L277-L378)):

| Function | Purpose |
|----------|---------|
| `createSession()` | Insert new session |
| `getSession()` | Retrieve by ID |
| `updateSession()` | Update fields |
| `deleteSession()` | Delete session |
| `addMessage()` | Insert message |
| `getMessages()` | List session messages |
| `createAttachment()` | Insert attachment |
| `linkAttachmentToMessage()` | Associate attachment with message |
| `updateAttachmentAnalysis()` | Store AI analysis |

---

## 10. Workspace Management

Each session has an isolated workspace directory for file operations.

### 10.1 Configuration

**Path Resolution** ([loop-agent-ui/src/lib/workspace.ts:7-9](loop-agent-ui/src/lib/workspace.ts#L7-L9)):

```typescript
const WORKSPACES_PATH = process.env.WORKSPACES_PATH
  || process.env.WORKSPACE_ROOT
  || path.join(process.cwd(), "data/workspaces");
```

### 10.2 Functions

| Function | Purpose | Reference |
|----------|---------|-----------|
| `getWorkspacePath(sessionId)` | Returns workspace path | [workspace.ts:14-16](loop-agent-ui/src/lib/workspace.ts#L14-L16) |
| `createWorkspace(sessionId)` | Creates directory | [workspace.ts:21-29](loop-agent-ui/src/lib/workspace.ts#L21-L29) |
| `workspaceExists(sessionId)` | Checks existence | [workspace.ts:34-37](loop-agent-ui/src/lib/workspace.ts#L34-L37) |
| `deleteWorkspace(sessionId)` | Removes directory recursively | [workspace.ts:42-51](loop-agent-ui/src/lib/workspace.ts#L42-L51) |
| `initializeWorkspace(sessionId, options)` | Creates with starter files | [workspace.ts:56-86](loop-agent-ui/src/lib/workspace.ts#L56-L86) |
| `listWorkspaceFiles(sessionId)` | Lists all files | [workspace.ts:91-119](loop-agent-ui/src/lib/workspace.ts#L91-L119) |

---

## 11. API Layer

### 11.1 Message Endpoint

**Route**: `POST /api/sessions/:id/message`

**File**: [loop-agent-ui/src/app/api/sessions/[id]/message/route.ts](loop-agent-ui/src/app/api/sessions/[id]/message/route.ts)

### 11.2 Request Flow

1. **Session Resolution** ([route.ts:12-17](loop-agent-ui/src/app/api/sessions/[id]/message/route.ts#L12-L17)):
   - Gets existing session or auto-creates one

2. **Message Validation** ([route.ts:22-34](loop-agent-ui/src/app/api/sessions/[id]/message/route.ts#L22-L34)):
   - Requires message text or attachments
   - Default prompt for image-only messages

3. **Message Storage** ([route.ts:36-44](loop-agent-ui/src/app/api/sessions/[id]/message/route.ts#L36-L44)):
   - Stores user message in database
   - Links attachments to message

4. **SSE Stream Creation** ([route.ts:52-155](loop-agent-ui/src/app/api/sessions/[id]/message/route.ts#L52-L155)):
   - Creates ReadableStream for response
   - Implements heartbeat (every 15s) to prevent timeout

5. **Agent Execution** ([route.ts:73](loop-agent-ui/src/app/api/sessions/[id]/message/route.ts#L73)):
   ```typescript
   for await (const event of runAgent(id, effectiveMessage, session.agentId, session.sessionId, model)) {
     controller.enqueue(encoder.encode(formatSSE(event)));
     // Track session ID, collect content, update stats
   }
   ```

6. **Session Update** ([route.ts:124-128](loop-agent-ui/src/app/api/sessions/[id]/message/route.ts#L124-L128)):
   - Stores assistant response
   - Updates cost and turn count

### 11.3 Response Format

**Headers**:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event Format** ([agent-runner.ts:151-153](loop-agent-ui/src/lib/agent-runner.ts#L151-L153)):
```
data: {"type":"assistant","content":"Hello..."}\n\n
data: {"type":"tool","toolName":"Read","content":"..."}\n\n
data: [DONE]\n\n
```

---

## 12. Message Flow

### 12.1 Standard Agent Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User Request                               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    POST /api/sessions/:id/message                    │
│                         (route.ts)                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │  Get/Create │         │    Store    │         │   Update    │
   │   Session   │         │   Message   │         │   Status    │
   └─────────────┘         └─────────────┘         └─────────────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      runAgent() Generator                            │
│                     (agent-runner.ts:27)                             │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Claude Agent SDK query()                         │
│                  (@anthropic-ai/claude-agent-sdk)                    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │   system    │         │  assistant  │         │   result    │
   │   (init)    │         │ (text/tool) │         │ (success)   │
   └─────────────┘         └─────────────┘         └─────────────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SSE Event Stream                                │
│                   (text/event-stream)                                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Frontend Client                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.2 Landing Page Generator Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                 User Input + Optional Images                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│            runLandingPageGenerator() (agent-runner.ts:205)           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│         Step 1: generateBrandKit() (brand-kit-generator.ts:24)       │
│         • Extracts brand info from text/images                       │
│         • Returns BrandKit with colors, typography, personality      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│         Step 2: LandingPageOrchestrator.generate()                   │
│                   (orchestrator.ts:64)                               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
      ┌────────────────────────────┼────────────────────────┐
      ▼                            │                        ▼
┌─────────────┐                    │                 ┌─────────────┐
│   Brand     │                    │                 │   Content   │
│  Analyst    │                    │                 │   Planner   │
│ (sync call) │                    │                 │ (SDK call)  │
└─────────────┘                    │                 └─────────────┘
      │                            │                        │
      │         ┌──────────────────┘                        │
      │         ▼                                           │
      │  ┌─────────────┐                                    │
      │  │   Design    │                                    │
      │  │   System    │                                    │
      │  │ (SDK call)  │                                    │
      │  └─────────────┘                                    │
      │         │                                           │
      └─────────┼───────────────────────────────────────────┘
                │         (Parallel Execution)
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 3: HTML Generator (SDK call)                       │
│              (html-generator.ts:411)                                 │
│              • Receives utility classes + content structure          │
│              • Generates HTML with only div/img/a/button             │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 4: Image Validation                                │
│              • Validates Unsplash URLs                               │
│              • Replaces broken images with fallbacks                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 5: Write HTML to Workspace                         │
│              • Timestamped filename: landing-page-YYYY-MM-DD.html    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

Loop Agent demonstrates a production-ready implementation of the Claude Agent SDK with:

1. **Flexible Agent Configuration**: Registry-based agent definitions with tool restrictions
2. **Session Persistence**: SQLite-backed sessions with SDK resumption support
3. **Real-time Streaming**: SSE-based event streaming with heartbeat
4. **Multi-Agent Orchestration**: Parallel execution of specialized sub-agents
5. **Workspace Isolation**: Per-session file system sandboxing
6. **Multimodal Support**: Image input processing for brand extraction

The architecture separates concerns cleanly:
- **Configuration** (`agents.ts`) defines agent behavior
- **Session Management** (`agent.ts`) handles state
- **Execution Engine** (`agent-runner.ts`) wraps the SDK
- **Orchestration** (`landing-page/`) coordinates multi-agent workflows
- **Persistence** (`db.ts`) stores all data
- **API Layer** (`route.ts`) exposes HTTP endpoints
