/**
 * Image Analyzer - Direct Claude API for fast image analysis.
 *
 * Uses the Anthropic SDK directly (not Agent SDK) for lower latency.
 * This is a separate process from the landing page generation which uses the Agent SDK.
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

// Initialize Anthropic client - uses ANTHROPIC_API_KEY env var
const anthropic = new Anthropic();

// Latest Claude Haiku model for fast, cost-effective image analysis
const IMAGE_ANALYSIS_MODEL = "claude-haiku-4-5-20251001";

// Supported image types for Claude API
type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function isSupportedImageType(mimeType: string): mimeType is ImageMediaType {
  return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType);
}

const IMAGE_ANALYSIS_SYSTEM_PROMPT = `You are an image analysis assistant. Analyze the provided image and return a concise but comprehensive description that will be used to generate a landing page.

Focus on:
1. **Subject/Content**: What is shown in the image (products, people, logos, scenes, characters)
2. **Colors**: Dominant colors, color palette, specific hex values if identifiable
3. **Style**: Visual style (modern, vintage, minimalist, bold, elegant, playful, cartoon, professional)
4. **Brand Elements**: Any logos, text, brand names visible
5. **Industry/Context**: What industry or business type this suggests (pest control, restaurant, tech, etc.)
6. **Mood/Feeling**: The emotional tone conveyed
7. **Suggested Use**: How this image could be used on a landing page (hero, product showcase, background, logo, mascot)

Be specific and actionable. This description will directly inform design decisions.

IMPORTANT: Clearly identify what type of business this image represents. For example:
- A cat catching mice/rats = pest control business
- Food photography = restaurant business
- Software screenshots = SaaS business
- Fitness imagery = gym/wellness business`;

const IMAGE_ANALYSIS_USER_PROMPT = `Analyze this image for use in landing page generation. Provide a structured analysis that identifies:
1. What the image shows
2. The dominant colors (with hex codes if possible)
3. The visual style
4. What type of business this likely represents
5. How it could be used on a landing page`;

/**
 * Analyze an image using the Claude API directly.
 * This is faster than using the Agent SDK because it avoids subprocess overhead.
 *
 * @param imagePath - Path to the image file on disk
 * @param mimeType - MIME type of the image
 * @returns Analysis text describing the image
 */
export async function analyzeImage(imagePath: string, mimeType: string): Promise<string> {
  if (!isSupportedImageType(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  // Read and encode image as base64
  const imageData = fs.readFileSync(imagePath);
  const base64Data = imageData.toString("base64");

  // Call Claude API directly
  const response = await anthropic.messages.create({
    model: IMAGE_ANALYSIS_MODEL,
    max_tokens: 1024,
    system: IMAGE_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: base64Data,
            },
          },
          {
            type: "text",
            text: IMAGE_ANALYSIS_USER_PROMPT,
          },
        ],
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from image analysis");
  }

  return textContent.text;
}

/**
 * Check if the Anthropic API key is configured.
 * Returns true if ANTHROPIC_API_KEY is set.
 */
export function isApiKeyConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
