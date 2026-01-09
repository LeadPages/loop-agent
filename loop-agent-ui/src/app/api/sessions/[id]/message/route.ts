import { NextRequest } from "next/server";
import { getSession, updateSession, createSession, addMessage } from "@/lib/agent";
import { runAgent, formatSSE, type SSEEvent } from "@/lib/agent-runner";

// POST /api/sessions/:id/message - Send message and stream response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let session = getSession(id);

  // Auto-create session if it doesn't exist
  if (!session) {
    session = createSession(id);
  }

  const body = await request.json();
  const { message } = body;

  if (!message) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Store the user message
  addMessage(crypto.randomUUID(), id, "user", message);

  // Update session status
  updateSession(id, { status: "active" });

  // Create a streaming response using Server-Sent Events
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let sdkSessionId: string | undefined;
      let totalCost = session?.costUsd || 0;
      let totalTurns = session?.turns || 0;
      let assistantContent = "";

      try {
        // Run the real Claude Agent SDK with the session's agent configuration
        for await (const event of runAgent(id, message, session!.agentId, session?.sessionId ?? undefined)) {
          // Send SSE event to client
          controller.enqueue(encoder.encode(formatSSE(event)));

          // Track session ID from init message
          if (event.type === "system" && event.sessionId) {
            sdkSessionId = event.sessionId;
            // Save SDK session ID for resumption
            updateSession(id, { sessionId: sdkSessionId });
          }

          // Collect assistant content for storage
          if (event.type === "assistant" && event.content) {
            assistantContent += event.content;
          }

          // Store tool usage as messages
          if (event.type === "tool" && event.toolName) {
            addMessage(
              crypto.randomUUID(),
              id,
              "tool",
              event.content || "",
              event.toolName
            );
          }

          // Update stats from result
          if (event.type === "result") {
            totalCost += event.costUsd || 0;
            totalTurns += event.turns || 0;
          }

          // Handle errors
          if (event.type === "error") {
            updateSession(id, { status: "error" });
          }
        }

        // Store the complete assistant response
        if (assistantContent) {
          addMessage(crypto.randomUUID(), id, "assistant", assistantContent);
        }

        // Send done signal
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        // Update session with final stats
        updateSession(id, {
          status: "idle",
          costUsd: totalCost,
          turns: totalTurns,
        });
      } catch (error) {
        console.error("Stream error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: "error",
              content: `An error occurred: ${errorMessage}`,
            })
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        updateSession(id, { status: "error" });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
