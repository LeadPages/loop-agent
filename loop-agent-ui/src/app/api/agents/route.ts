import { NextResponse } from "next/server";
import { listAgentConfigs } from "@/lib/agents";

// GET /api/agents - List all available agents
export async function GET() {
  const agents = listAgentConfigs();
  return NextResponse.json(agents);
}
