/**
 * SDK Client - Wrapper for Claude Agent SDK to make simple prompt/response calls.
 * Uses the same authentication as the main agent (Claude Code local login).
 */

import { query, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import fs from "fs";
import { randomUUID } from "crypto";

export interface PromptOptions {
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
}

export interface ImageInput {
  path: string;
  mimeType: string;
}

/**
 * Supported image MIME types for Claude API
 */
export type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

/**
 * Content block types for multimodal prompts (Anthropic SDK compatible)
 */
export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image";
  source: {
    type: "base64";
    media_type: ImageMediaType;
    data: string;
  };
};

export type ContentBlock = TextContent | ImageContent;

/**
 * Check if a MIME type is a supported image type for Claude API
 */
function isSupportedImageType(mimeType: string): mimeType is ImageMediaType {
  return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType);
}

/**
 * Build content blocks from text and optional images for multimodal prompts.
 */
export function buildContentBlocks(
  textPrompt: string,
  images?: ImageInput[]
): ContentBlock[] {
  const content: ContentBlock[] = [];

  // Add images first (Claude recommends images before text for better analysis)
  if (images && images.length > 0) {
    for (const img of images) {
      try {
        // Skip unsupported image types
        if (!isSupportedImageType(img.mimeType)) {
          console.warn(`[sdk-client] Skipping unsupported image type: ${img.mimeType}`);
          continue;
        }

        const imageData = fs.readFileSync(img.path);
        const base64Data = imageData.toString("base64");
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mimeType,
            data: base64Data,
          },
        });
      } catch (error) {
        console.error(`[sdk-client] Failed to read image ${img.path}:`, error);
        // Continue with other images if one fails
      }
    }
  }

  // Add text prompt
  content.push({
    type: "text",
    text: textPrompt,
  });

  return content;
}

/**
 * Create an async iterable that yields a single SDKUserMessage with multimodal content.
 * This is required because the query() function expects AsyncIterable<SDKUserMessage>
 * for non-string prompts.
 */
async function* createMultimodalPrompt(
  content: ContentBlock[],
  sessionId: string
): AsyncIterable<SDKUserMessage> {
  yield {
    type: "user",
    message: {
      role: "user",
      content: content,
    },
    parent_tool_use_id: null,
    uuid: randomUUID(),
    session_id: sessionId,
  };
}

/**
 * Make a simple prompt/response call using the Claude Agent SDK.
 * This uses the same auth as the main agent (no ANTHROPIC_API_KEY needed).
 * Supports optional images for multimodal prompts.
 */
export async function sdkPrompt(
  userPrompt: string,
  options: PromptOptions,
  images?: ImageInput[]
): Promise<string> {
  const { systemPrompt, model = "claude-sonnet-4-5-20250929" } = options;

  let responseText = "";

  // Determine if we need multimodal prompt
  const hasImages = images && images.length > 0;

  // Build prompt - either simple string or async iterable of SDKUserMessage
  const prompt = hasImages
    ? createMultimodalPrompt(
        buildContentBlocks(userPrompt, images),
        randomUUID() // Temporary session ID for multimodal prompt
      )
    : userPrompt;

  // Use query() with tools disabled for simple prompt/response
  for await (const message of query({
    prompt,
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
      // Path to Claude Code executable (only set in Docker/Railway, let SDK find it locally)
      ...(process.env.CLAUDE_CODE_PATH || process.env.RAILWAY_ENVIRONMENT
        ? { pathToClaudeCodeExecutable: process.env.CLAUDE_CODE_PATH || "/usr/local/bin/claude" }
        : {}),
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
 * Analyze an image and return a structured description.
 * Used when images are uploaded to extract context for landing page generation.
 */
export async function analyzeImage(imagePath: string, mimeType: string): Promise<string> {
  if (!isSupportedImageType(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const systemPrompt = `You are an image analysis assistant. Analyze the provided image and return a concise but comprehensive description that will be used to generate a landing page.

Focus on:
1. **Subject/Content**: What is shown in the image (products, people, logos, scenes)
2. **Colors**: Dominant colors, color palette, specific hex values if identifiable
3. **Style**: Visual style (modern, vintage, minimalist, bold, elegant, playful)
4. **Brand Elements**: Any logos, text, brand names visible
5. **Industry/Context**: What industry or business type this suggests
6. **Mood/Feeling**: The emotional tone conveyed
7. **Suggested Use**: How this image could be used on a landing page (hero, product showcase, background, logo)

Be specific and actionable. This description will directly inform design decisions.`;

  const userPrompt = `Analyze this image for use in landing page generation. Provide a structured analysis.`;

  const images: ImageInput[] = [{ path: imagePath, mimeType }];

  return await sdkPrompt(userPrompt, { systemPrompt, model: "claude-sonnet-4-5-20250929" }, images);
}

/**
 * Extract JSON from response text.
 * Handles direct JSON, code blocks, embedded JSON objects, and truncated responses.
 */
export function extractJsonFromText(text: string): Record<string, unknown> | null {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Continue to other methods
  }

  // Try finding JSON in code blocks (with closing ```)
  const jsonPattern = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match;

  while ((match = jsonPattern.exec(text)) !== null) {
    try {
      return JSON.parse(match[1]);
    } catch {
      continue;
    }
  }

  // Try finding JSON in code blocks WITHOUT closing ``` (truncated response)
  const truncatedCodeBlockPattern = /```(?:json)?\s*([\s\S]*)/;
  const truncatedMatch = text.match(truncatedCodeBlockPattern);
  if (truncatedMatch) {
    const jsonContent = truncatedMatch[1];
    try {
      return JSON.parse(jsonContent);
    } catch {
      // JSON is truncated, try to extract html property directly
      const htmlExtracted = extractHtmlFromTruncatedJson(jsonContent);
      if (htmlExtracted) {
        return { html: htmlExtracted, sections: {}, _truncated: true };
      }
    }
  }

  // Try finding JSON object
  const jsonObjPattern = /\{[\s\S]*\}/;
  const objMatch = text.match(jsonObjPattern);

  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {
      // JSON might be truncated, try to extract html
      const htmlExtracted = extractHtmlFromTruncatedJson(objMatch[0]);
      if (htmlExtracted) {
        return { html: htmlExtracted, sections: {}, _truncated: true };
      }
    }
  }

  return null;
}

/**
 * Extract HTML string from truncated JSON.
 * Handles cases where the model output was cut off mid-response.
 */
function extractHtmlFromTruncatedJson(text: string): string | null {
  // Look for "html": "..." pattern and extract the HTML string
  // The HTML starts with <!DOCTYPE or <html
  const htmlStartPattern = /"html"\s*:\s*"(<!DOCTYPE[\s\S]*?)(?:"\s*[,}]|$)/;
  const match = text.match(htmlStartPattern);

  if (match && match[1]) {
    let html = match[1];

    // Unescape JSON string escapes
    try {
      // Add quotes back and parse as JSON string to unescape
      html = JSON.parse(`"${html}"`);
    } catch {
      // If that fails, do basic unescaping
      html = html
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }

    // If HTML is truncated, try to close it properly
    if (!html.includes('</html>')) {
      // Close any open tags we can detect
      if (!html.includes('</body>')) {
        html += '\n</body>';
      }
      html += '\n</html>';
      console.warn('[extractJsonFromText] HTML was truncated, added closing tags');
    }

    return html;
  }

  return null;
}
