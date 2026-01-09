/**
 * SDK Client - Wrapper for Claude Agent SDK to make simple prompt/response calls.
 * Uses the same authentication as the main agent (Claude Code local login).
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

export interface PromptOptions {
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
}

/**
 * Make a simple prompt/response call using the Claude Agent SDK.
 * This uses the same auth as the main agent (no ANTHROPIC_API_KEY needed).
 */
export async function sdkPrompt(
  userPrompt: string,
  options: PromptOptions
): Promise<string> {
  const { systemPrompt, model = "claude-sonnet-4-20250514" } = options;

  let responseText = "";

  // Use query() with tools disabled for simple prompt/response
  for await (const message of query({
    prompt: userPrompt,
    options: {
      model,
      systemPrompt,
      // Disable all tools - we just want a text response
      tools: [],
      // Don't persist these ephemeral sessions
      persistSession: false,
      // Bypass permissions since we're not using tools
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      // Single turn only
      maxTurns: 1,
    },
  })) {
    if (message.type === "assistant") {
      // Collect text from assistant response
      for (const block of message.message.content) {
        if (block.type === "text") {
          responseText += block.text;
        }
      }
    } else if (message.type === "result" && message.subtype !== "success") {
      // Handle error subtypes: error_during_execution, error_max_turns, etc.
      const errorMsg = "errors" in message && Array.isArray(message.errors)
        ? message.errors.join(", ")
        : `Error: ${message.subtype}`;
      throw new Error(`SDK error: ${errorMsg}`);
    }
  }

  if (!responseText) {
    throw new Error("No response received from SDK");
  }

  return responseText;
}

/**
 * Extract JSON from response text.
 * Handles direct JSON, code blocks, and embedded JSON objects.
 */
export function extractJsonFromText(text: string): Record<string, unknown> | null {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Continue to other methods
  }

  // Try finding JSON in code blocks
  const jsonPattern = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match;

  while ((match = jsonPattern.exec(text)) !== null) {
    try {
      return JSON.parse(match[1]);
    } catch {
      continue;
    }
  }

  // Try finding JSON object
  const jsonObjPattern = /\{[\s\S]*\}/;
  const objMatch = text.match(jsonObjPattern);

  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {
      // Failed to parse
    }
  }

  return null;
}
