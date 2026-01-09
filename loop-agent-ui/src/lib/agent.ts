// Agent session management
// Uses SQLite database for persistent storage

import * as db from "./db";
import { createWorkspace, deleteWorkspace, getWorkspacePath } from "./workspace";
import { DEFAULT_AGENT_ID } from "./agents";

export interface AgentSession {
  id: string;
  name: string;
  agentId: string;
  sessionId: string | null; // SDK session_id for resumption
  cwd: string;
  status: "idle" | "active" | "ended" | "error";
  createdAt: Date;
  costUsd: number;
  turns: number;
}

// Convert database session to API session format
function toAgentSession(dbSession: db.DbSession): AgentSession {
  return {
    id: dbSession.id,
    name: dbSession.name,
    agentId: dbSession.agent_id,
    sessionId: dbSession.sdk_session_id,
    cwd: dbSession.cwd,
    status: dbSession.status as AgentSession["status"],
    createdAt: new Date(dbSession.created_at),
    costUsd: dbSession.cost_usd,
    turns: dbSession.turns,
  };
}

export function createSession(id: string, name?: string, agentId?: string): AgentSession {
  const cwd = createWorkspace(id);
  const sessionName = name || `Session ${id.slice(0, 8)}`;
  const sessionAgentId = agentId || DEFAULT_AGENT_ID;
  const dbSession = db.createSession(id, sessionName, sessionAgentId, cwd);
  return toAgentSession(dbSession);
}

export function getSession(id: string): AgentSession | undefined {
  const dbSession = db.getSession(id);
  return dbSession ? toAgentSession(dbSession) : undefined;
}

export function updateSession(
  id: string,
  updates: Partial<Pick<AgentSession, "name" | "sessionId" | "status" | "costUsd" | "turns">>
): AgentSession | undefined {
  const dbSession = db.updateSession(id, {
    name: updates.name,
    sdk_session_id: updates.sessionId ?? undefined,
    status: updates.status,
    cost_usd: updates.costUsd,
    turns: updates.turns,
  });
  return dbSession ? toAgentSession(dbSession) : undefined;
}

export function deleteSession(id: string): boolean {
  // Delete workspace files
  deleteWorkspace(id);
  // Delete from database
  return db.deleteSession(id);
}

export function listSessions(): AgentSession[] {
  return db.listSessions().map(toAgentSession);
}

// Re-export message functions for API routes
export { addMessage, getMessages } from "./db";
