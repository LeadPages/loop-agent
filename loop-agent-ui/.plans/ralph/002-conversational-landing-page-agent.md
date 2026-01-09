# Plan: Make Landing Page Generator Conversational

## Problem Statement

Currently, the landing page generator agent immediately starts generating a page regardless of what the user types. Users want to:

1. **Chat first** - Ask questions, discuss requirements before generation
2. **Iterate after** - Make changes to generated pages through conversation
3. **Control flow** - Explicitly trigger generation when ready

## Root Cause Analysis

### Current Architecture

```
agent-runner.ts:
├── runAgent()
│   └── if (agentId === "landing-page-generator")
│       └── yield* runLandingPageGenerator()  // ALWAYS generates
│           └── generateBrandKit(prompt)
│           └── orchestrator.generate()
│           └── Write HTML
```

**The Problem** (lines 34-38):
```typescript
if (agentId === "landing-page-generator") {
  yield* runLandingPageGenerator(sessionId, prompt);
  return;  // <-- Bypasses normal agent query entirely
}
```

Every message triggers full page generation. There's no:
- Intent detection
- Conversation history
- Conditional execution
- Edit/refinement flow

### What Users Actually Need

```
User Flow:
├── "What can you help me with?" → Agent explains capabilities
├── "I have a hotdog cart business" → Agent asks clarifying questions
├── "It operates at 11pm on the corner" → Agent gathers more info
├── "Generate the landing page" → Agent triggers generation
├── "Make the hero section bigger" → Agent modifies existing HTML
├── "Change the color to red" → Agent updates and regenerates preview
```

## Solution Options

### Option A: Intent-Based Routing (Hybrid Approach)

Keep the current fast-path generation but add Claude as a router to detect intent:

```
User Message → Intent Classifier → Route
                    ├── "generate" → runLandingPageGenerator()
                    ├── "modify" → runModifyPage()
                    └── "chat" → runConversation()
```

**Implementation:**
1. First turn: Use Claude to classify intent
2. If intent is "generate" and sufficient info → generate
3. If intent is "chat" or "question" → have conversation
4. If intent is "modify" → edit existing HTML

**Pros:**
- Preserves fast generation path
- Adds conversational capability
- Relatively simple to implement

**Cons:**
- Extra API call for classification
- May misclassify edge cases

### Option B: Full Conversational Agent (Recommended)

Replace the special-case handling with a proper conversational agent that has tools:

```
Landing Page Agent (uses SDK query())
├── System Prompt: "You are a landing page assistant..."
├── Tools:
│   ├── GenerateLandingPage(requirements: string) → generates page
│   ├── ModifyLandingPage(instructions: string) → edits existing
│   ├── ReadLandingPage() → reads current HTML
│   └── GetBrandKit() → extracts brand info
└── Conversation History: Maintained across turns
```

**Implementation:**
1. Remove special-case in agent-runner.ts
2. Create custom MCP tools for landing page operations
3. Let Claude decide when to call tools based on conversation

**Pros:**
- Natural conversation flow
- Claude decides when to generate
- Full edit/iterate capability
- Consistent with other agents

**Cons:**
- More complex implementation
- Need to create MCP tools
- May be slower for simple "just generate" use cases

### Option C: Subagent Architecture

Make landing page generation a subagent that other agents can invoke:

```
Main Conversational Agent
├── Has access to Task tool
├── Can spawn: landing-page-generator subagent
└── Orchestrates user interaction

Landing Page Subagent (background)
├── Called via Task tool
├── Generates page
└── Returns result to parent
```

**Pros:**
- Clean separation of concerns
- Main agent handles conversation
- Subagent handles generation
- Matches SDK's existing subagent pattern

**Cons:**
- More architectural change
- Need to define subagent interface
- May complicate session management

### Recommendation: Option B (Full Conversational Agent)

This provides the best user experience and aligns with how the SDK is designed to work.

## Detailed Implementation Plan for Option B

### Phase 1: Create Landing Page Tools

Create a new file `src/lib/landing-page/tools.ts` with tool definitions:

```typescript
// Tool 1: Generate Landing Page
export async function toolGenerateLandingPage(
  sessionId: string,
  requirements: string
): Promise<{ filename: string; sections: string[] }> {
  // Current generation logic moved here
}

// Tool 2: Modify Landing Page
export async function toolModifyLandingPage(
  sessionId: string,
  instructions: string
): Promise<{ filename: string; changes: string[] }> {
  // Read existing HTML
  // Apply modifications via Claude
  // Write updated HTML
}

// Tool 3: Read Current Page
export async function toolReadLandingPage(
  sessionId: string
): Promise<{ html: string; filename: string } | null> {
  // Read most recent landing page from workspace
}

// Tool 4: Extract Brand Kit
export async function toolExtractBrandKit(
  text: string
): Promise<BrandKit> {
  // Existing brand kit generation
}
```

### Phase 2: Register Tools as MCP Server or Custom Tools

**Option 2a: Use SDK's Custom Tools**

The SDK supports custom tool definitions via the `agents` option:

```typescript
// In agent-runner.ts
const options = {
  systemPrompt: LANDING_PAGE_SYSTEM_PROMPT,
  agents: {
    'generate-page': {
      description: 'Generate a landing page from requirements',
      prompt: 'Generate a landing page...',
      tools: ['Write']
    }
  }
};
```

**Option 2b: Create an MCP Server**

Create a local MCP server that provides landing page tools:

```typescript
// src/lib/landing-page/mcp-server.ts
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';

export const landingPageMcpServer = createSdkMcpServer({
  name: 'landing-page-tools',
  tools: [
    tool('generate_landing_page', 'Generate a landing page', schema, handler),
    tool('modify_landing_page', 'Modify existing page', schema, handler),
    tool('read_landing_page', 'Read current page', schema, handler),
  ]
});
```

### Phase 3: Update System Prompt

```typescript
export const LANDING_PAGE_CONVERSATIONAL_PROMPT = `
You are a landing page generation assistant. You help users create and refine landing pages.

## Your Capabilities

1. **Conversation**: Discuss requirements, ask clarifying questions, explain options
2. **Generation**: Create landing pages when the user is ready
3. **Modification**: Edit existing pages based on feedback

## How to Interact

- When the user asks questions → Answer them conversationally
- When the user describes a business → Ask clarifying questions to gather requirements
- When the user says "generate", "create", or "build" → Use the generate_landing_page tool
- When the user wants changes → Use the modify_landing_page tool
- When the user asks to see the current page → Use the read_landing_page tool

## Gathering Requirements

Before generating, try to understand:
- Business name and type
- Target audience
- Key services/products
- Desired tone/style
- Any specific sections needed

## After Generation

Always offer to make changes. Common refinements:
- Color adjustments
- Section reordering
- Content changes
- Adding/removing sections

Be conversational and helpful. Don't just generate - collaborate with the user.
`;
```

### Phase 4: Remove Special-Case Handling

```typescript
// agent-runner.ts
// REMOVE these lines:
if (agentId === "landing-page-generator") {
  yield* runLandingPageGenerator(sessionId, prompt);
  return;
}

// KEEP normal SDK query() flow for all agents
```

### Phase 5: Update Agent Config

```typescript
// agents.ts
{
  id: "landing-page-generator",
  name: "Landing Page Generator",
  description: "Conversational assistant for creating and editing landing pages",
  systemPrompt: LANDING_PAGE_CONVERSATIONAL_PROMPT,
  allowedTools: ["Read", "Write", "Edit", "Glob", "Grep"],
  mcpServers: {
    'landing-page': landingPageMcpServer
  },
  // ...
}
```

## Modification Tool Design

The `modify_landing_page` tool needs special consideration:

### Approach 1: Full Regeneration with Constraints

```typescript
async function modifyLandingPage(instructions: string) {
  // 1. Read existing HTML
  const currentHtml = readCurrentPage();

  // 2. Extract current structure
  const structure = parseHtmlStructure(currentHtml);

  // 3. Apply modifications via Claude
  const modifiedStructure = await applyModifications(structure, instructions);

  // 4. Regenerate HTML
  const newHtml = await generateFromStructure(modifiedStructure);

  // 5. Write and return
  return writeAndReturn(newHtml);
}
```

### Approach 2: Direct HTML Editing

```typescript
async function modifyLandingPage(instructions: string) {
  // 1. Read existing HTML
  const currentHtml = readCurrentPage();

  // 2. Use Claude to edit HTML directly
  const modifiedHtml = await sdkPrompt(
    `Modify this HTML according to instructions: "${instructions}"\n\n${currentHtml}`,
    { systemPrompt: HTML_MODIFICATION_PROMPT }
  );

  // 3. Validate and write
  return writeAndReturn(modifiedHtml);
}
```

### Recommendation: Approach 2 for simplicity

Direct editing is faster and preserves more of the original structure.

## State Management for Edits

Need to track:
- Current generated file per session
- Brand kit (for consistent regeneration)
- Conversation context

### Implementation

Store in workspace metadata file:

```typescript
// workspace/{sessionId}/.landing-page-state.json
{
  "currentFile": "landing-page-2026-01-09T10-30-00.html",
  "brandKit": { ... },
  "generationHistory": [
    { "timestamp": "...", "file": "...", "prompt": "..." }
  ]
}
```

## Alternative: Quick Hybrid Implementation

If full conversational is too complex for now, a simpler hybrid:

### Phase 1 (Quick Win): Add Generate Command

```typescript
// In runLandingPageGenerator, check for explicit command:
if (prompt.toLowerCase().startsWith('/generate') ||
    prompt.toLowerCase().includes('generate landing page')) {
  // Do generation
} else {
  // Pass to normal SDK query for conversation
  yield* runConversationalLandingPage(sessionId, prompt);
}
```

### Phase 2: Add Modify Command

```typescript
if (prompt.toLowerCase().startsWith('/modify') ||
    prompt.toLowerCase().includes('change the')) {
  yield* runModifyLandingPage(sessionId, prompt);
}
```

## Recommended Implementation Order

1. **First**: Implement concurrent session fix (Plan 001) - unblocks testing
2. **Second**: Add simple command detection (`/generate`, `/modify`)
3. **Third**: Create modify tool for iterating on pages
4. **Fourth**: Full conversational flow with MCP tools (if time permits)

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/landing-page/tools.ts` | Create | Tool implementations |
| `src/lib/landing-page/state.ts` | Create | State management |
| `src/lib/landing-page/mcp-server.ts` | Create | MCP tool server |
| `src/lib/agent-runner.ts` | Modify | Remove special-case, use SDK |
| `src/lib/agents.ts` | Modify | Update system prompt, add MCP config |

## Success Criteria

- [ ] User can ask "What can you help with?" and get a response (no generation)
- [ ] User can describe business and agent asks follow-up questions
- [ ] User can explicitly trigger generation with "generate my landing page"
- [ ] User can say "make the header bigger" and see changes
- [ ] Conversation context is maintained across turns
- [ ] Preview updates after modifications

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing generation | Keep fast-path for explicit generate commands |
| Slow conversation | Use haiku for intent classification |
| Lost context | Store state in workspace |
| Complex MCP setup | Start with simple command detection first |

## Estimated Complexity

**Medium-High** for full conversational flow
**Low** for command-based hybrid approach

## Recommendation

Start with **hybrid approach** (command detection):
1. Quick to implement
2. Unblocks user needs
3. Provides foundation for full conversational later
4. Low risk to existing functionality
