# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Architecture

Dashboard UI for managing multiple Claude Agent SDK sessions.

**Tech Stack:**
- Next.js 16 (App Router)
- shadcn/ui + Tailwind CSS v4
- TypeScript
- Docker for Railway deployment

**Project Structure:**
```
src/
├── app/
│   ├── page.tsx              # Main dashboard page
│   ├── layout.tsx            # Root layout (dark mode)
│   └── api/
│       └── sessions/
│           ├── route.ts      # GET list, POST create
│           └── [id]/
│               ├── route.ts  # GET detail, DELETE
│               └── message/
│                   └── route.ts  # POST message (SSE streaming)
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx       # Session list sidebar
│   │   └── chat.tsx          # Chat interface
│   └── ui/                   # shadcn components
└── lib/
    ├── agent.ts              # Agent session management
    └── utils.ts              # shadcn utilities
```

## API

**Sessions:**
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `DELETE /api/sessions/:id` - End session
- `POST /api/sessions/:id/message` - Send message (returns SSE stream)

**SSE Stream Events:**
- `{ type: "tool", toolName: string, content: string }` - Tool usage
- `{ type: "assistant", content: string }` - Assistant response chunk
- `{ type: "result", costUsd: number, turns: number }` - Final result
- `[DONE]` - Stream complete

## Deployment

The app uses `output: "standalone"` for Docker deployment. Build with:
```bash
docker build -t loop-agent-ui .
docker run -p 3000:3000 loop-agent-ui
```
