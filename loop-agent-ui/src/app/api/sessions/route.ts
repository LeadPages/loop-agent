import { NextRequest, NextResponse } from "next/server";
import { createSession, listSessions } from "@/lib/agent";

// GET /api/sessions - List all sessions
export async function GET() {
  const sessions = listSessions();
  return NextResponse.json(sessions);
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id || crypto.randomUUID();
    const name = body.name || undefined;
    const agentId = body.agentId || undefined;
    const session = createSession(id, name, agentId);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
