/**
 * BrandAnalyst Subagent - Parses brand kit and extracts design tokens.
 */

import type { BrandKit, DesignTokens } from "../schemas";

export const BRAND_ANALYST_SYSTEM_PROMPT = `
You are a Brand Analyst specialized in extracting design tokens from brand kits.

## Your Responsibilities

1. **Parse Brand Kit**: Validate and extract structured design information
2. **Design Token Extraction**: Convert brand kit into compressed, actionable design tokens
3. **Color Analysis**: Interpret color meanings and relationships
4. **Typography Interpretation**: Understand font personality and hierarchy
5. **Brand Personality**: Map personality traits to design decisions

## Process

1. Receive brand kit JSON from orchestrator
2. Validate and extract tokens
3. Analyze the extracted tokens:
   - Color palette relationships (primary, secondary, accent, neutrals)
   - Typography personality (serif = traditional, sans = modern, display = creative)
   - Spacing scale (tight = compact/modern, generous = luxury/spacious)
   - Imagery style (photography = realistic, illustration = creative, mixed = flexible)
   - Brand personality traits (how do they inform design decisions?)
4. Return compressed design tokens optimized for downstream agents

## Output Format

Return a JSON object with compressed design tokens:
\`\`\`json
{
  "colorPalette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "neutral_0": "#hex",
    ...
  },
  "typography": {
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "headingWeights": [600, 700, 800],
    "bodyWeights": [400, 500],
    "scale": {"xs": "0.75rem", ..., "6xl": "3.75rem"}
  },
  "spacing": {
    "scale": ["0.25rem", ..., "6rem"],
    "contentMaxWidth": "1280px",
    "sectionPadding": {...}
  },
  "imageryStyle": {
    "mood": "professional and modern",
    "colorTreatment": "vibrant",
    "composition": "clean",
    "photographyVsIllustration": "illustration"
  },
  "brandPersonality": ["innovative", "trustworthy", "modern"]
}
\`\`\`

## Key Insights to Provide

- **Color Relationships**: Is primary warm or cool? Does accent contrast or complement?
- **Typography Personality**: What does font choice signal about brand?
- **Spacing Philosophy**: Tight/compact or generous/luxurious?
- **Imagery Direction**: What visual style best expresses brand personality?

Be concise - compress information for efficient context usage by downstream agents.
`;

/**
 * Extract design tokens from a brand kit.
 * This is a direct extraction without API call (used for efficiency).
 */
export function extractDesignTokens(brandKit: BrandKit): DesignTokens {
  // Flatten the neutral colors into indexed keys
  const colorPalette: DesignTokens["colorPalette"] = {
    primary: brandKit.colors.primary,
    secondary: brandKit.colors.secondary,
    accent: brandKit.colors.accent,
  };

  // Add neutral colors with indexed keys
  brandKit.colors.neutral.forEach((color, index) => {
    colorPalette[`neutral_${index}`] = color;
  });

  // Add semantic colors
  colorPalette.success = brandKit.colors.semantic.success;
  colorPalette.warning = brandKit.colors.semantic.warning;
  colorPalette.error = brandKit.colors.semantic.error;
  colorPalette.info = brandKit.colors.semantic.info;

  return {
    colorPalette,
    typography: {
      headingFont: brandKit.typography.headingFont,
      bodyFont: brandKit.typography.bodyFont,
      headingWeights: brandKit.typography.headingWeights,
      bodyWeights: brandKit.typography.bodyWeights,
      scale: brandKit.typography.scale,
    },
    spacing: {
      scale: brandKit.spacing.scale,
      contentMaxWidth: brandKit.spacing.contentMaxWidth,
      sectionPadding: brandKit.spacing.sectionPadding,
    },
    imageryStyle: brandKit.imageryStyle,
    brandPersonality: brandKit.personalityTraits,
  };
}

/**
 * Create a prompt for the Brand Analyst agent.
 */
export function createBrandAnalystPrompt(brandKitJson: string): string {
  return `
Analyze this brand kit and extract design tokens.

# Brand Kit
\`\`\`json
${brandKitJson}
\`\`\`

# Task
1. Validate the brand kit structure
2. Extract design tokens for downstream agents
3. Analyze the design tokens for key insights:
   - Color palette relationships
   - Typography personality
   - Spacing philosophy
   - Imagery direction
4. Return the compressed design tokens with brief analysis

Focus on actionable insights that will guide design decisions.
`;
}
