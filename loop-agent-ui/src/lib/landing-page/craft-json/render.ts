/**
 * CraftJSON Render Service
 *
 * Converts CraftJSON to HTML via the backend render API.
 */

import type { CraftJSON, RenderResult } from "./types";

const RENDER_ENDPOINT = "http://localhost:3001/builder4/craft-json/render";

/**
 * Render CraftJSON to HTML via the backend API
 */
export async function renderCraftJSON(craftJSON: CraftJSON): Promise<RenderResult> {
  try {
    const response = await fetch(RENDER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ craft_json: craftJSON }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        html: "",
        error: `Render API error (${response.status}): ${errorText}`,
      };
    }

    const html = await response.text();
    return { html };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      html: "",
      error: `Failed to render CraftJSON: ${errorMessage}`,
    };
  }
}

/**
 * Render CraftJSON with retry logic
 */
export async function renderCraftJSONWithRetry(
  craftJSON: CraftJSON,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<RenderResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await renderCraftJSON(craftJSON);

    if (!result.error) {
      return result;
    }

    lastError = result.error;

    // Don't wait on the last attempt
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  return {
    html: "",
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
  };
}

/**
 * Check if the render service is available
 */
export async function checkRenderServiceHealth(): Promise<boolean> {
  try {
    // Try a simple request to check if the service is up
    const response = await fetch(RENDER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ craft_json: { ROOT: {}, version: 10 } }),
    });

    // Even if it returns an error (invalid JSON), the service is up
    return response.status !== 502 && response.status !== 503 && response.status !== 0;
  } catch {
    return false;
  }
}
