/**
 * Image Placeholder Replacement - Uses Unsplash for placeholder images.
 * No API key required - uses Unsplash Source API.
 */

import type { ImageNeeded } from "./schemas";

/**
 * Generate an Unsplash image URL from context keywords.
 * Uses Unsplash Source API: https://source.unsplash.com/
 */
function getUnsplashUrl(context: string, width = 800, height = 600): string {
  // Extract keywords from context, clean up and limit
  const keywords = context
    .toLowerCase()
    .replace(/[^a-z0-9\s,]/g, "") // Remove special chars
    .split(/[\s,]+/) // Split on spaces and commas
    .filter((word) => word.length > 2) // Remove short words
    .slice(0, 3) // Limit to 3 keywords
    .join(",");

  // Use Unsplash Source API (no API key needed)
  // Adding random param to avoid caching same image for different placeholders
  const random = Math.random().toString(36).substring(7);
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keywords)}&sig=${random}`;
}

/**
 * Get appropriate dimensions based on image type/context.
 */
function getDimensions(id: string, context: string): { width: number; height: number } {
  const idLower = id.toLowerCase();
  const contextLower = context.toLowerCase();

  // Hero images - wide landscape
  if (idLower.includes("hero") || contextLower.includes("hero")) {
    return { width: 1200, height: 800 };
  }

  // Icons - small square
  if (idLower.includes("icon") || contextLower.includes("icon")) {
    return { width: 200, height: 200 };
  }

  // Logos - wide
  if (idLower.includes("logo") || contextLower.includes("logo")) {
    return { width: 400, height: 200 };
  }

  // Background images - large
  if (idLower.includes("background") || idLower.includes("bg") || contextLower.includes("background")) {
    return { width: 1920, height: 1080 };
  }

  // Feature images - medium landscape
  if (idLower.includes("feature") || contextLower.includes("feature")) {
    return { width: 600, height: 400 };
  }

  // Default - medium size
  return { width: 800, height: 600 };
}

/**
 * Replace all image placeholders in HTML with Unsplash URLs.
 */
export function replaceImagePlaceholders(
  html: string,
  imagesNeeded: ImageNeeded[]
): string {
  let result = html;

  for (const image of imagesNeeded) {
    const { id, context } = image;
    const placeholder = `[PLACEHOLDER:${id}]`;

    if (result.includes(placeholder)) {
      const { width, height } = getDimensions(id, context);
      const imageUrl = getUnsplashUrl(context, width, height);
      result = result.replace(new RegExp(escapeRegExp(placeholder), "g"), imageUrl);
    }
  }

  // Also replace any remaining placeholders that weren't in imagesNeeded
  // Use a generic business/technology image
  const remainingPlaceholders = result.match(/\[PLACEHOLDER:[^\]]+\]/g) || [];
  for (const placeholder of remainingPlaceholders) {
    const id = placeholder.slice(13, -1); // Extract ID from [PLACEHOLDER:id]
    const { width, height } = getDimensions(id, "business modern");
    const imageUrl = getUnsplashUrl("business modern technology", width, height);
    result = result.replace(new RegExp(escapeRegExp(placeholder), "g"), imageUrl);
  }

  return result;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
