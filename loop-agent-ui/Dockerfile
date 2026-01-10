FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Add build tools for native modules (better-sqlite3)
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PATH="/usr/local/bin:$PATH"

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache libstdc++

# Install Claude Code CLI globally and ensure it's in PATH
RUN npm install -g @anthropic-ai/claude-code && \
    which claude && \
    claude --version

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create directories for data and workspaces
RUN mkdir -p /app/data /tmp/loop-agent-workspaces && \
    chown -R nextjs:nodejs /app/data /tmp/loop-agent-workspaces

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy native modules from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/sessions.db
ENV WORKSPACE_ROOT=/tmp/loop-agent-workspaces

CMD ["node", "server.js"]
