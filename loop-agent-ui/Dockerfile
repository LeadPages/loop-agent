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

# Accept build args for NEXT_PUBLIC_* env vars (needed at build time)
ARG NEXT_PUBLIC_ACCESS_CODE
ENV NEXT_PUBLIC_ACCESS_CODE=$NEXT_PUBLIC_ACCESS_CODE

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PATH="/usr/local/bin:$PATH"

# Install runtime dependencies for better-sqlite3 and su-exec for entrypoint
RUN apk add --no-cache libstdc++ su-exec

# Install Claude Code CLI globally and ensure it's in PATH
RUN npm install -g @anthropic-ai/claude-code && \
    which claude && \
    claude --version

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create directories for data and workspaces
# /loop-data is the Railway volume mount point
RUN mkdir -p /app/data /loop-data /tmp/loop-agent-workspaces && \
    chown -R nextjs:nodejs /app/data /loop-data /tmp/loop-agent-workspaces

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy native modules from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Copy entrypoint script
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/loop-data/sessions.db
ENV WORKSPACE_ROOT=/loop-data/workspaces

# Run as root initially so entrypoint can fix volume permissions, then switch to nextjs
CMD ["/docker-entrypoint.sh"]
