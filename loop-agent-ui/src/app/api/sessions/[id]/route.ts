import { NextRequest, NextResponse } from "next/server";
import { getSession, deleteSession, getMessages } from "@/lib/agent";
import { getAgentConfig } from "@/lib/agents";

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

  // Include messages and agent info in response
  const messages = getMessages(id);
  const agent = getAgentConfig(session.agentId);

  return NextResponse.json({
    ...session,
    messages,
    agent,
  });
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
