# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start "your prompt"   # Run agent with a prompt
npm run build             # Compile TypeScript to dist/
npm run typecheck         # Type check without emitting
```

## Architecture

This is a coding agent built with the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`). The agent uses the `query()` function to stream messages from Claude with access to file and shell tools.

**Entry point**: `src/index.ts` - Takes a prompt from CLI args, runs the agent query, and handles three message types:
- `system` (init): Session metadata
- `assistant`: Claude's responses and tool calls
- `result`: Final outcome with cost/turn metrics

**Available tools**: Read, Write, Edit, Bash, Glob, Grep

## SDK Patterns

The SDK returns an async generator. Handle messages in a `for await` loop:
```typescript
for await (const message of query({ prompt, options })) {
  // Handle message.type: "system" | "assistant" | "result"
}
```

For automated workflows without permission prompts, enable bypass mode:
```typescript
options: {
  permissionMode: "bypassPermissions",
  allowDangerouslySkipPermissions: true,
}
```
