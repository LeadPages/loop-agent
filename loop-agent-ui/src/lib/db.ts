import Database, { type Database as DatabaseType, type Statement } from "better-sqlite3";
import path from "path";
import fs from "fs";

// Database path - use environment variable or default to data directory
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "sessions.db");

// Lazy-initialized database connection
let _db: DatabaseType | null = null;

function getDb(): DatabaseType {
  if (_db) return _db;

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize database connection
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");

  // Create tables
  _db.exec(`
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

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      message_id TEXT,
      session_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      stored_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      analysis TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_session_id ON attachments(session_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
  `);

  // Migration: Add agent_id column if it doesn't exist (for existing databases)
  try {
    _db.exec(`ALTER TABLE sessions ADD COLUMN agent_id TEXT NOT NULL DEFAULT 'loop-agent-safe'`);
  } catch {
    // Column already exists, ignore
  }

  // Migration: Add analysis column to attachments if it doesn't exist
  try {
    _db.exec(`ALTER TABLE attachments ADD COLUMN analysis TEXT`);
  } catch {
    // Column already exists, ignore
  }

  return _db;
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

export interface DbAttachment {
  id: string;
  message_id: string | null;
  session_id: string;
  filename: string;
  stored_path: string;
  mime_type: string;
  size_bytes: number;
  analysis: string | null;
  created_at: string;
}

// Lazy-initialized prepared statements
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _insertSessionStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _getSessionStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _listSessionsStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _updateSessionStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _deleteSessionStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _insertMessageStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _getMessagesStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _deleteMessagesBySessionStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _insertAttachmentStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _getAttachmentStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _getAttachmentsBySessionStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _getAttachmentsByMessageStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _linkAttachmentToMessageStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _deleteAttachmentStmt: Statement<any[]> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _updateAttachmentAnalysisStmt: Statement<any[]> | null = null;

function getInsertSessionStmt() {
  if (!_insertSessionStmt) {
    _insertSessionStmt = getDb().prepare(`
      INSERT INTO sessions (id, name, agent_id, cwd, status, cost_usd, turns)
      VALUES (?, ?, ?, ?, 'idle', 0, 0)
    `);
  }
  return _insertSessionStmt;
}

function getGetSessionStmt() {
  if (!_getSessionStmt) {
    _getSessionStmt = getDb().prepare(`SELECT * FROM sessions WHERE id = ?`);
  }
  return _getSessionStmt;
}

function getListSessionsStmt() {
  if (!_listSessionsStmt) {
    _listSessionsStmt = getDb().prepare(`SELECT * FROM sessions ORDER BY created_at DESC`);
  }
  return _listSessionsStmt;
}

function getUpdateSessionStmt() {
  if (!_updateSessionStmt) {
    _updateSessionStmt = getDb().prepare(`
      UPDATE sessions SET
        name = COALESCE(?, name),
        sdk_session_id = COALESCE(?, sdk_session_id),
        status = COALESCE(?, status),
        cost_usd = COALESCE(?, cost_usd),
        turns = COALESCE(?, turns),
        updated_at = datetime('now')
      WHERE id = ?
    `);
  }
  return _updateSessionStmt;
}

function getDeleteSessionStmt() {
  if (!_deleteSessionStmt) {
    _deleteSessionStmt = getDb().prepare(`DELETE FROM sessions WHERE id = ?`);
  }
  return _deleteSessionStmt;
}

function getInsertMessageStmt() {
  if (!_insertMessageStmt) {
    _insertMessageStmt = getDb().prepare(`
      INSERT INTO messages (id, session_id, type, content, tool_name)
      VALUES (?, ?, ?, ?, ?)
    `);
  }
  return _insertMessageStmt;
}

function getGetMessagesStmt() {
  if (!_getMessagesStmt) {
    _getMessagesStmt = getDb().prepare(`SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC`);
  }
  return _getMessagesStmt;
}

function getDeleteMessagesBySessionStmt() {
  if (!_deleteMessagesBySessionStmt) {
    _deleteMessagesBySessionStmt = getDb().prepare(`DELETE FROM messages WHERE session_id = ?`);
  }
  return _deleteMessagesBySessionStmt;
}

function getInsertAttachmentStmt() {
  if (!_insertAttachmentStmt) {
    _insertAttachmentStmt = getDb().prepare(`
      INSERT INTO attachments (id, session_id, filename, stored_path, mime_type, size_bytes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
  }
  return _insertAttachmentStmt;
}

function getGetAttachmentStmt() {
  if (!_getAttachmentStmt) {
    _getAttachmentStmt = getDb().prepare(`SELECT * FROM attachments WHERE id = ?`);
  }
  return _getAttachmentStmt;
}

function getGetAttachmentsBySessionStmt() {
  if (!_getAttachmentsBySessionStmt) {
    _getAttachmentsBySessionStmt = getDb().prepare(`SELECT * FROM attachments WHERE session_id = ? ORDER BY created_at ASC`);
  }
  return _getAttachmentsBySessionStmt;
}

function getGetAttachmentsByMessageStmt() {
  if (!_getAttachmentsByMessageStmt) {
    _getAttachmentsByMessageStmt = getDb().prepare(`SELECT * FROM attachments WHERE message_id = ? ORDER BY created_at ASC`);
  }
  return _getAttachmentsByMessageStmt;
}

function getLinkAttachmentToMessageStmt() {
  if (!_linkAttachmentToMessageStmt) {
    _linkAttachmentToMessageStmt = getDb().prepare(`UPDATE attachments SET message_id = ? WHERE id = ?`);
  }
  return _linkAttachmentToMessageStmt;
}

function getDeleteAttachmentStmt() {
  if (!_deleteAttachmentStmt) {
    _deleteAttachmentStmt = getDb().prepare(`DELETE FROM attachments WHERE id = ?`);
  }
  return _deleteAttachmentStmt;
}

function getUpdateAttachmentAnalysisStmt() {
  if (!_updateAttachmentAnalysisStmt) {
    _updateAttachmentAnalysisStmt = getDb().prepare(`UPDATE attachments SET analysis = ? WHERE id = ?`);
  }
  return _updateAttachmentAnalysisStmt;
}

// Export database operations
export function createSession(id: string, name: string, agentId: string, cwd: string): DbSession {
  getInsertSessionStmt().run(id, name, agentId, cwd);
  return getGetSessionStmt().get(id) as DbSession;
}

export function getSession(id: string): DbSession | undefined {
  return getGetSessionStmt().get(id) as DbSession | undefined;
}

export function listSessions(): DbSession[] {
  return getListSessionsStmt().all() as DbSession[];
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
  getUpdateSessionStmt().run(
    updates.name ?? null,
    updates.sdk_session_id ?? null,
    updates.status ?? null,
    updates.cost_usd ?? null,
    updates.turns ?? null,
    id
  );
  return getGetSessionStmt().get(id) as DbSession | undefined;
}

export function deleteSession(id: string): boolean {
  const result = getDeleteSessionStmt().run(id);
  return result.changes > 0;
}

export function addMessage(
  id: string,
  sessionId: string,
  type: string,
  content: string,
  toolName?: string
): DbMessage {
  getInsertMessageStmt().run(id, sessionId, type, content, toolName ?? null);
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
  return getGetMessagesStmt().all(sessionId) as DbMessage[];
}

export function deleteMessages(sessionId: string): void {
  getDeleteMessagesBySessionStmt().run(sessionId);
}

// Attachment operations
export function createAttachment(
  id: string,
  sessionId: string,
  filename: string,
  storedPath: string,
  mimeType: string,
  sizeBytes: number
): DbAttachment {
  getInsertAttachmentStmt().run(id, sessionId, filename, storedPath, mimeType, sizeBytes);
  return getGetAttachmentStmt().get(id) as DbAttachment;
}

export function getAttachment(id: string): DbAttachment | undefined {
  return getGetAttachmentStmt().get(id) as DbAttachment | undefined;
}

export function getAttachmentsBySession(sessionId: string): DbAttachment[] {
  return getGetAttachmentsBySessionStmt().all(sessionId) as DbAttachment[];
}

export function getAttachmentsByMessage(messageId: string): DbAttachment[] {
  return getGetAttachmentsByMessageStmt().all(messageId) as DbAttachment[];
}

export function linkAttachmentToMessage(attachmentId: string, messageId: string): void {
  getLinkAttachmentToMessageStmt().run(messageId, attachmentId);
}

export function deleteAttachment(id: string): boolean {
  const result = getDeleteAttachmentStmt().run(id);
  return result.changes > 0;
}

export function updateAttachmentAnalysis(id: string, analysis: string): void {
  getUpdateAttachmentAnalysisStmt().run(analysis, id);
}

// Export db getter for direct access if needed
export { getDb as db };
