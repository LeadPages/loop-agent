/**
 * Brand Kit Generator - Generates brand kits from unstructured text input.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { BrandKit, BrandKitResult } from "./schemas";
import {
  getBrandKitSystemPrompt,
  getBrandKitExtractionPrompt,
} from "./prompts/brand-kit-generation";
import {
  INDUSTRY_TEMPLATES,
  generateNeutralScale,
  getDefaultTypographyScale,
  getDefaultSpacingScale,
} from "./prompts/industry-templates";

/**
 * Generate a brand kit from unstructured text input.
 */
export async function generateBrandKit(
  unstructuredText: string,
  industryHint?: string
): Promise<BrandKitResult> {
  const client = new Anthropic();

  // Get industry context if available
  const industryContext = industryHint
    ? JSON.stringify(INDUSTRY_TEMPLATES[industryHint.toLowerCase()] || {})
    : "";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system:
      getBrandKitSystemPrompt() +
      (industryContext ? `\n\nIndustry Context:\n${industryContext}` : ""),
    messages: [
      {
        role: "user",
        content: getBrandKitExtractionPrompt(unstructuredText),
      },
    ],
  });

  const responseText = extractText(response);
  const rawBrandKit = extractJsonFromText(responseText);

  if (!rawBrandKit) {
    throw new Error("Failed to generate brand kit from input");
  }

  // Parse, validate, and auto-fix
  const { brandKit, warnings } = parseAndValidateBrandKit(rawBrandKit);
  const confidence = calculateConfidence(brandKit, warnings, unstructuredText);

  return { brandKit, confidence, warnings };
}

/**
 * Parse and validate raw brand kit JSON, auto-fixing where possible.
 */
function parseAndValidateBrandKit(raw: Record<string, unknown>): {
  brandKit: BrandKit;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Extract and validate name
  const name = (raw.name as string) || "Unknown Brand";
  if (!raw.name) {
    warnings.push("Brand name was not provided, using default");
  }

  // Extract and validate colors
  const rawColors = (raw.colors as Record<string, unknown>) || {};
  const colors = {
    primary: validateHexColor(rawColors.primary as string) || "#6366F1",
    secondary: validateHexColor(rawColors.secondary as string) || "#8B5CF6",
    accent: validateHexColor(rawColors.accent as string) || "#EC4899",
    neutral: validateNeutralScale(rawColors.neutral as string[]),
    semantic: {
      success:
        validateHexColor(
          (rawColors.semantic as Record<string, string>)?.success
        ) || "#10B981",
      warning:
        validateHexColor(
          (rawColors.semantic as Record<string, string>)?.warning
        ) || "#F59E0B",
      error:
        validateHexColor(
          (rawColors.semantic as Record<string, string>)?.error
        ) || "#EF4444",
      info:
        validateHexColor((rawColors.semantic as Record<string, string>)?.info) ||
        "#3B82F6",
    },
  };

  if (!rawColors.primary) {
    warnings.push("Primary color was not provided, using default");
  }

  // Extract and validate typography
  const rawTypography = (raw.typography as Record<string, unknown>) || {};
  const typography = {
    headingFont: (rawTypography.headingFont as string) || "Inter",
    bodyFont: (rawTypography.bodyFont as string) || "Inter",
    headingWeights: validateWeights(rawTypography.headingWeights as number[]) || [
      600, 700, 800,
    ],
    bodyWeights: validateWeights(rawTypography.bodyWeights as number[]) || [
      400, 500,
    ],
    scale:
      (rawTypography.scale as Record<string, string>) ||
      getDefaultTypographyScale(),
  };

  // Extract and validate spacing
  const rawSpacing = (raw.spacing as Record<string, unknown>) || {};
  const spacing = {
    scale: (rawSpacing.scale as string[]) || getDefaultSpacingScale(),
    contentMaxWidth: (rawSpacing.contentMaxWidth as string) || "1280px",
    sectionPadding: {
      mobile:
        (rawSpacing.sectionPadding as Record<string, string>)?.mobile ||
        "2.5rem",
      tablet:
        (rawSpacing.sectionPadding as Record<string, string>)?.tablet || "4rem",
      desktop:
        (rawSpacing.sectionPadding as Record<string, string>)?.desktop || "6rem",
    },
  };

  // Extract and validate imagery style
  const rawImagery = (raw.imageryStyle as Record<string, string>) || {};
  const imageryStyle = {
    mood: rawImagery.mood || "modern and professional",
    colorTreatment: validateColorTreatment(rawImagery.colorTreatment),
    composition: validateComposition(rawImagery.composition),
    photographyVsIllustration: validatePhotoVsIllustration(
      rawImagery.photographyVsIllustration
    ),
  };

  // Extract personality traits
  const personalityTraits = validatePersonalityTraits(
    raw.personalityTraits as string[]
  );

  // Extract business info
  const rawBusinessInfo = (raw.businessInfo as Record<string, unknown>) || {};
  const businessInfo = {
    name: (rawBusinessInfo.name as string) || name,
    tagline: rawBusinessInfo.tagline as string | undefined,
    email: rawBusinessInfo.email as string | undefined,
    phone: rawBusinessInfo.phone as string | undefined,
    location: rawBusinessInfo.location as string | undefined,
    currency: (rawBusinessInfo.currency as string) || "USD",
    services: rawBusinessInfo.services as string[] | undefined,
  };

  const brandKit: BrandKit = {
    name,
    colors,
    typography,
    spacing,
    imageryStyle,
    personalityTraits,
    businessInfo,
  };

  return { brandKit, warnings };
}

/**
 * Validate and normalize hex color.
 */
function validateHexColor(color: string | undefined): string | null {
  if (!color) return null;

  // Check if it's a valid 6-digit hex
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toUpperCase();
  }

  // Check if it's a valid 3-digit hex and expand
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return null;
}

/**
 * Validate neutral scale, generating default if invalid.
 */
function validateNeutralScale(neutrals: string[] | undefined): string[] {
  if (!neutrals || neutrals.length !== 10) {
    return generateNeutralScale(false); // Cool neutrals as default
  }

  const validated = neutrals.map(
    (c, i) => validateHexColor(c) || generateNeutralScale(false)[i]
  );
  return validated;
}

/**
 * Validate font weights.
 */
function validateWeights(weights: number[] | undefined): number[] | null {
  if (!weights || !Array.isArray(weights)) return null;

  const validWeights = weights.filter(
    (w) => typeof w === "number" && w >= 100 && w <= 900
  );
  return validWeights.length > 0 ? validWeights : null;
}

/**
 * Validate color treatment.
 */
function validateColorTreatment(
  value: string | undefined
): "vibrant" | "muted" | "monochrome" {
  if (value === "vibrant" || value === "muted" || value === "monochrome") {
    return value;
  }
  return "vibrant";
}

/**
 * Validate composition.
 */
function validateComposition(
  value: string | undefined
): "clean" | "busy" | "minimal" | "dynamic" {
  if (
    value === "clean" ||
    value === "busy" ||
    value === "minimal" ||
    value === "dynamic"
  ) {
    return value;
  }
  return "clean";
}

/**
 * Validate photography vs illustration.
 */
function validatePhotoVsIllustration(
  value: string | undefined
): "photography" | "illustration" | "mixed" {
  if (
    value === "photography" ||
    value === "illustration" ||
    value === "mixed"
  ) {
    return value;
  }
  return "photography";
}

/**
 * Validate personality traits.
 */
function validatePersonalityTraits(traits: string[] | undefined): string[] {
  if (!traits || !Array.isArray(traits)) {
    return ["professional", "modern", "trustworthy"];
  }

  const validTraits = traits.filter(
    (t) => typeof t === "string" && t.length > 0
  );
  if (validTraits.length < 2) {
    return ["professional", "modern", "trustworthy"];
  }
  if (validTraits.length > 5) {
    return validTraits.slice(0, 5);
  }
  return validTraits;
}

/**
 * Calculate confidence score based on validation results.
 */
function calculateConfidence(
  brandKit: BrandKit,
  warnings: string[],
  originalInput: string
): number {
  let confidence = 1.0;

  // Reduce confidence for each warning
  confidence -= warnings.length * 0.1;

  // Check if name appears in original input
  const nameWords = brandKit.name.toLowerCase().split(/\s+/);
  const inputLower = originalInput.toLowerCase();
  const nameMatch = nameWords.some((word) => inputLower.includes(word));
  if (!nameMatch) {
    confidence -= 0.15;
  }

  // Check input length (more input = potentially more confidence)
  if (originalInput.length < 50) {
    confidence -= 0.2;
  } else if (originalInput.length < 100) {
    confidence -= 0.1;
  }

  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Extract text from Anthropic message response.
 */
function extractText(message: Anthropic.Message): string {
  const textParts: string[] = [];
  for (const block of message.content) {
    if (block.type === "text") {
      textParts.push(block.text);
    }
  }
  return textParts.join("\n");
}

/**
 * Extract JSON from response text.
 */
function extractJsonFromText(text: string): Record<string, unknown> | null {
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
