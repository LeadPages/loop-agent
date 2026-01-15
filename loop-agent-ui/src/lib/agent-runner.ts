import { query } from "@anthropic-ai/claude-agent-sdk";
import fs from "fs";
import path from "path";
import { createWorkspace, getWorkspacePath } from "./workspace";
import { getAgentConfig, DEFAULT_AGENT_ID } from "./agents";
import { generateBrandKit, LandingPageOrchestrator } from "./landing-page";
import { getAttachmentsBySession, type DbAttachment } from "./db";
import type { ImageInput } from "./landing-page/sdk-client";

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
  previewFile?: string; // Filename of generated preview (for landing page generator)
}

/**
 * Run the Claude Agent SDK and yield SSE-compatible events
 */
export async function* runAgent(
  sessionId: string,
  prompt: string,
  agentId: string,
  sdkSessionId?: string,
  model?: string
): AsyncGenerator<SSEEvent> {
  // Get agent configuration
  const agentConfig = getAgentConfig(agentId) || getAgentConfig(DEFAULT_AGENT_ID)!;

  // Special handling for landing page generator
  if (agentId === "landing-page-generator") {
    // Fetch attachments for the session to pass images to the brand kit generator
    const attachments = getAttachmentsBySession(sessionId);
    yield* runLandingPageGenerator(sessionId, prompt, model, attachments);
    return;
  }

  // Ensure workspace exists
  const cwd = createWorkspace(sessionId);

  console.log(`[agent-runner] Starting agent for session ${sessionId}, agent: ${agentId}, cwd: ${cwd}`);

  try {
    // Build query options based on agent config
    const options: Parameters<typeof query>[0]["options"] = {
      cwd,
      systemPrompt: agentConfig.systemPrompt,
      allowedTools: agentConfig.allowedTools,
      // For automated workflows, bypass permission prompts
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      // Path to Claude Code executable (only set in Docker/Railway, let SDK find it locally)
      ...(process.env.CLAUDE_CODE_PATH || process.env.RAILWAY_ENVIRONMENT
        ? { pathToClaudeCodeExecutable: process.env.CLAUDE_CODE_PATH || "/usr/local/bin/claude" }
        : {}),
      // Model selection (if provided)
      ...(model && { model }),
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
    console.log(`[agent-runner] Calling SDK query with prompt: "${prompt.substring(0, 50)}..."`);
    for await (const message of query({ prompt, options })) {
      console.log(`[agent-runner] Received message type: ${message.type}`);

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
    console.error(`[agent-runner] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    console.error(`[agent-runner] Error message: ${errorMessage}`);
    console.error(`[agent-runner] Error stack: ${errorStack}`);
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
 * Convert database attachments to ImageInput array for brand kit generation.
 * Only includes image attachments (filters out other file types).
 */
function convertAttachmentsToImages(
  sessionId: string,
  attachments: DbAttachment[]
): ImageInput[] {
  const workspacePath = getWorkspacePath(sessionId);
  const images: ImageInput[] = [];

  for (const attachment of attachments) {
    // Only include image attachments
    if (attachment.mime_type.startsWith("image/")) {
      // Convert stored_path (filename) to full filesystem path in uploads directory
      const fullPath = path.join(workspacePath, "uploads", attachment.stored_path);

      // Verify file exists before adding
      if (fs.existsSync(fullPath)) {
        images.push({
          path: fullPath,
          mimeType: attachment.mime_type,
        });
      } else {
        console.warn(`[agent-runner] Image file not found: ${fullPath}`);
      }
    }
  }

  return images;
}

/**
 * Run the landing page generator with multi-agent orchestration
 */
async function* runLandingPageGenerator(
  sessionId: string,
  prompt: string,
  model?: string,
  attachments?: DbAttachment[]
): AsyncGenerator<SSEEvent> {
  const cwd = createWorkspace(sessionId);
  const selectedModel = model || "claude-sonnet-4-20250514";

  try {
    yield {
      type: "system",
      sessionId,
      model: selectedModel,
      tools: ["LandingPageOrchestrator"],
    };

    // Convert attachments to images for brand kit generation
    const images = attachments && attachments.length > 0
      ? convertAttachmentsToImages(sessionId, attachments)
      : undefined;

    // Step 1: Generate brand kit
    yield {
      type: "assistant",
      content: images && images.length > 0
        ? `Analyzing your input and ${images.length} image(s) to extract brand information...`
        : "Analyzing your input to extract brand information...",
    };

    yield {
      type: "tool",
      toolName: "BrandKitGenerator",
      content: images && images.length > 0
        ? `Extracting brand kit from text and ${images.length} image(s)...`
        : "Extracting brand kit from unstructured text...",
    };

    const { brandKit, confidence, warnings } = await generateBrandKit(prompt, undefined, images);

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
      model: selectedModel,
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

    // Step 3: Write to workspace with timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `landing-page-${timestamp}.html`;
    const outputPath = path.join(cwd, filename);
    fs.writeFileSync(outputPath, finalHtml);

    yield {
      type: "tool",
      toolName: "Write",
      content: `Wrote ${finalHtml.length} characters to ${filename}`,
    };

    yield {
      type: "assistant",
      content: `Landing page generated successfully!

**Sections:** ${sections.join(", ")}

**File:** ${filename} (${finalHtml.length} characters)

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
      previewFile: filename,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    yield {
      type: "error",
      content: `Landing page generation failed: ${errorMessage}`,
    };
  }
}
