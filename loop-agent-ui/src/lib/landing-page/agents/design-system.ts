/**
 * DesignSystem Subagent - Generates Tailwind configuration from brand tokens.
 * Uses Claude Agent SDK for authentication (same as main agent).
 */

import type { DesignTokens, UtilityClasses } from "../schemas";
import { DESIGN_PRINCIPLES } from "../prompts/design-principles";
import { sdkPrompt, extractJsonFromText } from "../sdk-client";

export const DESIGN_SYSTEM_SYSTEM_PROMPT = `
You are a Design System Architect specialized in creating Tailwind CSS configurations from brand tokens.

## Your Responsibilities

1. **Tailwind Config Generation**: Create Tailwind CSS configurations from brand tokens
2. **Utility Class Creation**: Generate reusable utility class patterns
3. **Design Principles Enforcement**: Apply anti-AI-slop principles rigorously
4. **Responsive Patterns**: Define responsive utility classes

## Critical Design Principles

${DESIGN_PRINCIPLES}

## Process

1. Receive design tokens from Brand Analyst
2. Generate Tailwind configuration:
   - Color scales using arbitrary values: bg-[#6366F1]
   - Typography utilities with responsive variants
   - Spacing patterns aligned with brand scale
   - Responsive breakpoint patterns
3. Create utility class set for common intents:
   - heading_1, heading_2, heading_3 (with dramatic size differences)
   - body_large, body_text
   - cta_primary, cta_secondary (with hover states)
   - card (with hover shadow transition)
   - container, section
   - link (with hover states)
4. Return comprehensive utility class dictionary

## Output Format

Return JSON object with utility classes:
\`\`\`json
{
  "heading_1": "text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-[#111827]",
  "heading_2": "text-4xl md:text-5xl font-bold text-[#111827]",
  "heading_3": "text-2xl font-bold text-[#111827]",
  "body_large": "text-xl leading-relaxed text-neutral-700",
  "body_text": "text-lg leading-relaxed text-neutral-600",
  "cta_primary": "bg-[#EC4899] hover:bg-opacity-90 text-white py-4 px-8 rounded-lg font-semibold transition-colors duration-200",
  "cta_secondary": "bg-white border-2 border-[#6366F1] text-[#6366F1] hover:bg-opacity-10 py-4 px-8 rounded-lg font-semibold transition-all duration-200",
  "card": "bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200",
  "container": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  "section": "py-16 md:py-24 lg:py-32 px-4",
  "link": "text-[#EC4899] hover:opacity-80 font-semibold transition-opacity duration-200"
}
\`\`\`

## Critical Requirements

1. **ALWAYS include hover states** for interactive elements (buttons, links, cards)
2. **Use dramatic size differences** in typography hierarchy (not subtle)
3. **Include responsive variants** where appropriate (sm:, md:, lg:)
4. **Use brand colors** with arbitrary values: bg-[#HEX]
5. **Add transitions** for all hover effects: transition-colors duration-200

## Anti-Patterns to Avoid

- Missing hover states
- Subtle type scale (text-2xl vs text-xl) - USE DRAMATIC DIFFERENCES
- Generic colors (bg-blue-600) - USE BRAND COLORS: bg-[#6366F1]
- No transitions on interactive elements
- Identical border-radius everywhere

Be ruthless in applying design principles - you must actively counter AI tendency toward generic output.
`;

/**
 * Create prompt for the Design System agent.
 */
export function createDesignSystemPrompt(designTokens: DesignTokens): string {
  return `
Generate a complete Tailwind utility class set from these design tokens.

# Design Tokens
\`\`\`json
${JSON.stringify(designTokens, null, 2)}
\`\`\`

# Task
1. Create comprehensive utility classes
2. Ensure all classes follow design principles:
   - Dramatic typography hierarchy
   - ALWAYS include hover states
   - Use brand colors with arbitrary values
   - Include responsive variants
   - Add transitions to all interactive elements
3. Review the generated classes and ensure they're not generic AI slop
4. Return the utility class dictionary as JSON

Remember: Your output will determine whether the final landing page looks distinctive or generic. Be bold with your choices.

Return ONLY a valid JSON object with utility classes, no markdown code blocks, no explanations.
`;
}

/**
 * Generate design system utility classes via Claude Agent SDK.
 */
export async function generateDesignSystem(
  designTokens: DesignTokens,
  model?: string
): Promise<UtilityClasses> {
  try {
    const responseText = await sdkPrompt(
      createDesignSystemPrompt(designTokens),
      { systemPrompt: DESIGN_SYSTEM_SYSTEM_PROMPT, model }
    );
    const utilityClasses = extractJsonFromText(responseText);

    if (!utilityClasses) {
      // Fallback: generate utility classes directly
      return generateDefaultUtilityClasses(designTokens);
    }

    return utilityClasses as UtilityClasses;
  } catch {
    // Fallback: generate utility classes directly
    return generateDefaultUtilityClasses(designTokens);
  }
}

/**
 * Generate default utility classes as fallback.
 */
export function generateDefaultUtilityClasses(
  designTokens: DesignTokens
): UtilityClasses {
  const colors = designTokens.colorPalette;
  const primary = colors.primary || "#6366F1";
  const accent = colors.accent || "#EC4899";
  const neutral9 = colors.neutral_9 || "#1F2937";

  return {
    heading_1: `text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-[${neutral9}]`,
    heading_2: `text-4xl md:text-5xl font-bold text-[${neutral9}]`,
    heading_3: `text-2xl font-bold text-[${neutral9}]`,
    body_large: "text-xl leading-relaxed text-neutral-700",
    body_text: "text-lg leading-relaxed text-neutral-600",
    cta_primary: `bg-[${accent}] hover:bg-opacity-90 text-white py-4 px-8 text-lg rounded-lg font-semibold transition-colors duration-200`,
    cta_secondary: `bg-white border-2 border-[${primary}] text-[${primary}] hover:bg-[${primary}] hover:bg-opacity-10 py-4 px-8 text-lg rounded-lg font-semibold transition-all duration-200`,
    card: "bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200",
    container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    section: "py-16 md:py-24 lg:py-32 px-4",
    link: `text-[${accent}] hover:opacity-80 font-semibold transition-opacity duration-200`,
  };
}

