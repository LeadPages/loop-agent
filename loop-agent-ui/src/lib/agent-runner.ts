import { query } from "@anthropic-ai/claude-agent-sdk";
import { createWorkspace } from "./workspace";
import { getAgentConfig, DEFAULT_AGENT_ID, type AgentConfig } from "./agents";

// Types for SSE events we emit
export interface SSEEvent {
  type: "system" | "assistant" | "tool" | "result" | "error";
  content?: string;
  toolName?: string;
  sessionId?: string;
  model?: string;
  tools?: string[];
  costUsd?: number;
  turns?: number;
  result?: string;
}

/**
 * Run the Claude Agent SDK and yield SSE-compatible events
 */
export async function* runAgent(
  sessionId: string,
  prompt: string,
  agentId: string,
  sdkSessionId?: string
): AsyncGenerator<SSEEvent> {
  // Get agent configuration
  const agentConfig = getAgentConfig(agentId) || getAgentConfig(DEFAULT_AGENT_ID)!;

  // Ensure workspace exists
  const cwd = createWorkspace(sessionId);

  try {
    // Build query options based on agent config
    const options: Parameters<typeof query>[0]["options"] = {
      cwd,
      systemPrompt: agentConfig.systemPrompt,
      allowedTools: agentConfig.allowedTools,
      // For automated workflows, bypass permission prompts
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    };

    // Apply workspace restrictions if configured
    if (agentConfig.restrictToWorkspace) {
      options.additionalDirectories = agentConfig.additionalDirectories || [];
    }

    // Add resume option if we have a previous session
    if (sdkSessionId) {
      options.resume = sdkSessionId;
    }

    // Run the agent query
    for await (const message of query({ prompt, options })) {
      switch (message.type) {
        case "system":
          if (message.subtype === "init") {
            // Emit init event with session info
            yield {
              type: "system",
              sessionId: message.session_id,
              model: message.model,
              tools: message.tools,
            };
          }
          break;

        case "assistant":
          // Process assistant message content blocks
          for (const block of message.message.content) {
            if (block.type === "text") {
              yield {
                type: "assistant",
                content: block.text,
              };
            } else if (block.type === "tool_use") {
              yield {
                type: "tool",
                toolName: block.name,
                content: JSON.stringify(block.input, null, 2),
              };
            }
          }
          break;

        case "result":
          if (message.subtype === "success") {
            yield {
              type: "result",
              result: message.result,
              costUsd: message.total_cost_usd,
              turns: message.num_turns,
            };
          } else {
            // Handle error results
            const resultMsg = message as { subtype: string; errors?: string[] };
            const errorMessage = resultMsg.errors
              ? resultMsg.errors.join("\n")
              : `Agent error: ${resultMsg.subtype}`;
            yield {
              type: "error",
              content: errorMessage,
            };
          }
          break;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    yield {
      type: "error",
      content: `Agent execution failed: ${errorMessage}`,
    };
  }
}

/**
 * Convert SSE event to text/event-stream format
 */
export function formatSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
