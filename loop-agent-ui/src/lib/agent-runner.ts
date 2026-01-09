import { query } from "@anthropic-ai/claude-agent-sdk";
import fs from "fs";
import path from "path";
import { createWorkspace } from "./workspace";
import { getAgentConfig, DEFAULT_AGENT_ID } from "./agents";
import { generateBrandKit, LandingPageOrchestrator } from "./landing-page";

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

  // Special handling for landing page generator
  if (agentId === "landing-page-generator") {
    yield* runLandingPageGenerator(sessionId, prompt);
    return;
  }

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

/**
 * Run the landing page generator with multi-agent orchestration
 */
async function* runLandingPageGenerator(
  sessionId: string,
  prompt: string
): AsyncGenerator<SSEEvent> {
  const cwd = createWorkspace(sessionId);

  try {
    yield {
      type: "system",
      sessionId,
      model: "claude-sonnet-4-20250514",
      tools: ["LandingPageOrchestrator"],
    };

    // Step 1: Generate brand kit
    yield {
      type: "assistant",
      content: "Analyzing your input to extract brand information...",
    };

    yield {
      type: "tool",
      toolName: "BrandKitGenerator",
      content: "Extracting brand kit from unstructured text...",
    };

    const { brandKit, confidence, warnings } = await generateBrandKit(prompt);

    yield {
      type: "assistant",
      content: `Brand kit extracted (${Math.round(confidence * 100)}% confidence):
- Business: ${brandKit.name}
- Colors: Primary ${brandKit.colors.primary}, Secondary ${brandKit.colors.secondary}, Accent ${brandKit.colors.accent}
- Typography: ${brandKit.typography.headingFont} / ${brandKit.typography.bodyFont}
- Style: ${brandKit.personalityTraits.join(", ")}
${warnings.length > 0 ? `\nWarnings: ${warnings.join(", ")}` : ""}`,
    };

    // Step 2: Run the orchestrator
    yield {
      type: "assistant",
      content: "Generating landing page with multi-agent orchestration...",
    };

    const orchestrator = new LandingPageOrchestrator({
      brandKit,
      requirements: prompt,
    });

    let finalHtml = "";
    let sections: string[] = [];

    for await (const progress of orchestrator.generate()) {
      yield {
        type: "tool",
        toolName: "LandingPageOrchestrator",
        content: `[${progress.state}] ${progress.message}`,
      };

      if (progress.state === "complete" && progress.details?.sections) {
        sections = progress.details.sections as string[];
      }
    }

    finalHtml = orchestrator.getFinalHtml() || "";

    // Step 3: Write to workspace
    const outputPath = path.join(cwd, "generated.html");
    fs.writeFileSync(outputPath, finalHtml);

    yield {
      type: "tool",
      toolName: "Write",
      content: `Wrote ${finalHtml.length} characters to generated.html`,
    };

    yield {
      type: "assistant",
      content: `Landing page generated successfully!

**Sections:** ${sections.join(", ")}

**File:** generated.html (${finalHtml.length} characters)

The HTML has been written to your workspace. You can preview it by opening the generated.html file in a browser.

The page includes:
- Responsive design (mobile-first)
- Tailwind CSS via CDN
- Brand-consistent colors and typography
- Proper hover states on interactive elements
- Only div, img, a, button elements (semantic markup via Tailwind)`,
    };

    yield {
      type: "result",
      result: "Landing page generated",
      costUsd: 0, // TODO: Track actual cost
      turns: 1,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    yield {
      type: "error",
      content: `Landing page generation failed: ${errorMessage}`,
    };
  }
}
