import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Database path - use environment variable or default to data directory
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "sessions.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    agent_id TEXT NOT NULL DEFAULT 'loop-agent-safe',
    sdk_session_id TEXT,
    cwd TEXT NOT NULL,
    status TEXT DEFAULT 'idle',
    cost_usd REAL DEFAULT 0,
    turns INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    tool_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
`);

// Migration: Add agent_id column if it doesn't exist (for existing databases)
try {
  db.exec(`ALTER TABLE sessions ADD COLUMN agent_id TEXT NOT NULL DEFAULT 'loop-agent-safe'`);
} catch {
  // Column already exists, ignore
}

// Type definitions
export interface DbSession {
  id: string;
  name: string;
  agent_id: string;
  sdk_session_id: string | null;
  cwd: string;
  status: string;
  cost_usd: number;
  turns: number;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  session_id: string;
  type: string;
  content: string;
  tool_name: string | null;
  created_at: string;
}

// Session operations
const insertSessionStmt = db.prepare(`
  INSERT INTO sessions (id, name, agent_id, cwd, status, cost_usd, turns)
  VALUES (?, ?, ?, ?, 'idle', 0, 0)
`);

const getSessionStmt = db.prepare(`
  SELECT * FROM sessions WHERE id = ?
`);

const listSessionsStmt = db.prepare(`
  SELECT * FROM sessions ORDER BY created_at DESC
`);

const updateSessionStmt = db.prepare(`
  UPDATE sessions SET
    name = COALESCE(?, name),
    sdk_session_id = COALESCE(?, sdk_session_id),
    status = COALESCE(?, status),
    cost_usd = COALESCE(?, cost_usd),
    turns = COALESCE(?, turns),
    updated_at = datetime('now')
  WHERE id = ?
`);

const deleteSessionStmt = db.prepare(`
  DELETE FROM sessions WHERE id = ?
`);

// Message operations
const insertMessageStmt = db.prepare(`
  INSERT INTO messages (id, session_id, type, content, tool_name)
  VALUES (?, ?, ?, ?, ?)
`);

const getMessagesStmt = db.prepare(`
  SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC
`);

const deleteMessagesBySessionStmt = db.prepare(`
  DELETE FROM messages WHERE session_id = ?
`);

// Export database operations
export function createSession(id: string, name: string, agentId: string, cwd: string): DbSession {
  insertSessionStmt.run(id, name, agentId, cwd);
  return getSessionStmt.get(id) as DbSession;
}

export function getSession(id: string): DbSession | undefined {
  return getSessionStmt.get(id) as DbSession | undefined;
}

export function listSessions(): DbSession[] {
  return listSessionsStmt.all() as DbSession[];
}

export function updateSession(
  id: string,
  updates: {
    name?: string;
    sdk_session_id?: string;
    status?: string;
    cost_usd?: number;
    turns?: number;
  }
): DbSession | undefined {
  updateSessionStmt.run(
    updates.name ?? null,
    updates.sdk_session_id ?? null,
    updates.status ?? null,
    updates.cost_usd ?? null,
    updates.turns ?? null,
    id
  );
  return getSessionStmt.get(id) as DbSession | undefined;
}

export function deleteSession(id: string): boolean {
  const result = deleteSessionStmt.run(id);
  return result.changes > 0;
}

export function addMessage(
  id: string,
  sessionId: string,
  type: string,
  content: string,
  toolName?: string
): DbMessage {
  insertMessageStmt.run(id, sessionId, type, content, toolName ?? null);
  return {
    id,
    session_id: sessionId,
    type,
    content,
    tool_name: toolName ?? null,
    created_at: new Date().toISOString(),
  };
}

export function getMessages(sessionId: string): DbMessage[] {
  return getMessagesStmt.all(sessionId) as DbMessage[];
}

export function deleteMessages(sessionId: string): void {
  deleteMessagesBySessionStmt.run(sessionId);
}

export { db };
