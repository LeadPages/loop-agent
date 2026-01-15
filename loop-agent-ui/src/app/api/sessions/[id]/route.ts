import { NextRequest, NextResponse } from "next/server";
import { getSession, deleteSession, getMessages, updateSession } from "@/lib/agent";
import { getAttachmentsByMessage, DbMessage, DbAttachment } from "@/lib/db";
import { getAgentConfig } from "@/lib/agents";
import { listWorkspaceFiles } from "@/lib/workspace";

// Transform a DbAttachment to the frontend Attachment format
function toAttachment(sessionId: string, dbAttachment: DbAttachment) {
  return {
    id: dbAttachment.id,
    filename: dbAttachment.filename,
    url: `/api/sessions/${sessionId}/uploads/${dbAttachment.stored_path}`,
    mimeType: dbAttachment.mime_type,
    sizeBytes: dbAttachment.size_bytes,
    analysis: dbAttachment.analysis,
  };
}

// Get messages with their attachments for a session
function getMessagesWithAttachments(sessionId: string) {
  const messages = getMessages(sessionId) as DbMessage[];
  return messages.map((message) => {
    const attachments = getAttachmentsByMessage(message.id);
    return {
      ...message,
      attachments: attachments.length > 0
        ? attachments.map((a) => toAttachment(sessionId, a))
        : undefined,
    };
  });
}

// GET /api/sessions/:id - Get session details with messages and agent info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Include messages (with attachments) and agent info in response
  const messages = getMessagesWithAttachments(id);
  const agent = getAgentConfig(session.agentId);

  // Find preview file (HTML files in workspace)
  const workspaceFiles = listWorkspaceFiles(id);
  const previewFile = workspaceFiles.find((f) => f.endsWith(".html")) || null;

  return NextResponse.json({
    ...session,
    messages,
    agent,
    previewFile,
  });
}

// PATCH /api/sessions/:id - Update session (e.g., rename)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const session = updateSession(id, { name: name.trim() });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to update session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

// DELETE /api/sessions/:id - End session and cleanup workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteSession(id);

  if (!deleted) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
