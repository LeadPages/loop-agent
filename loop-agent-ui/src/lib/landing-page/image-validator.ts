/**
 * Image Validator - Validates Unsplash URLs and replaces broken ones with fallbacks.
 */

/**
 * Validate that an image URL is accessible.
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      // Short timeout to avoid blocking
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Extract dimensions from an Unsplash URL.
 */
function extractDimensions(url: string): { width: number; height: number } {
  try {
    const urlObj = new URL(url);
    const width = parseInt(urlObj.searchParams.get('w') || '800', 10);
    const height = parseInt(urlObj.searchParams.get('h') || '600', 10);
    return { width, height };
  } catch {
    return { width: 800, height: 600 };
  }
}

/**
 * Generate a fallback image URL using Picsum.photos.
 * Picsum is a reliable, free image service that doesn't require API keys.
 */
function getFallbackUrl(originalUrl: string, index: number): string {
  const { width, height } = extractDimensions(originalUrl);
  // Use index as seed to get consistent but different images
  const seed = `fallback-${index}-${Date.now()}`;
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Validate all Unsplash URLs in HTML and replace broken ones with fallbacks.
 */
export async function validateAndReplaceImages(html: string): Promise<string> {
  // Match Unsplash image URLs
  const unsplashRegex = /https:\/\/images\.unsplash\.com\/photo-[^"'\s)]+/g;
  const matches = html.match(unsplashRegex);

  if (!matches || matches.length === 0) {
    return html;
  }

  // Get unique URLs
  const uniqueUrls = [...new Set(matches)];

  // Validate all URLs in parallel
  const validationResults = await Promise.all(
    uniqueUrls.map(async (url, index) => {
      const isValid = await validateImageUrl(url);
      return {
        url,
        isValid,
        fallback: isValid ? url : getFallbackUrl(url, index),
      };
    })
  );

  // Replace invalid URLs with fallbacks
  let result = html;
  for (const { url, isValid, fallback } of validationResults) {
    if (!isValid) {
      console.log(`[image-validator] Replacing broken URL: ${url.substring(0, 50)}...`);
      // Use replaceAll for all occurrences
      result = result.split(url).join(fallback);
    }
  }

  const replacedCount = validationResults.filter(r => !r.isValid).length;
  if (replacedCount > 0) {
    console.log(`[image-validator] Replaced ${replacedCount} broken image(s) with fallbacks`);
  }

  return result;
}

/**
 * Generate placeholder image URLs using Picsum.
 * This can be used in prompts to instruct the model to use reliable URLs.
 */
export function getPicsumUrl(keyword: string, width = 800, height = 600): string {
  const seed = encodeURIComponent(keyword.toLowerCase().replace(/\s+/g, '-'));
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
