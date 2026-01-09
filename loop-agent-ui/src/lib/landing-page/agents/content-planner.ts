/**
 * ContentPlanner Subagent - Structures landing page sections and content hierarchy.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ContentStructure } from "../schemas";
import { COMPOSITION_PATTERNS } from "../prompts/composition-patterns";

export const CONTENT_PLANNER_SYSTEM_PROMPT = `
You are a Content Planner specialized in structuring landing page sections and content hierarchy.

## Your Responsibilities

1. **Section Structure**: Determine optimal section sequence for landing page
2. **Composition Pattern Selection**: Choose appropriate patterns for each section
3. **Content Hierarchy**: Define heading/body/CTA structure for each section
4. **Image Requirements**: Identify where images are needed and what type

## Available Composition Patterns

${COMPOSITION_PATTERNS}

## Process

1. Receive user requirements and brand personality
2. Determine section sequence based on:
   - Page goal (lead gen, product showcase, etc.)
   - Brand personality (professional = structured, playful = varied)
   - Target audience
3. For each section:
   - Select appropriate composition pattern
   - Define content structure (headings, body, CTAs)
   - Identify image needs
4. Return structured content plan

## Common Landing Page Structures

### SaaS Product
1. Hero (centered_hero_with_image): Value prop + CTA
2. Features (three_column_grid): Key features
3. Social Proof (logo_strip): Client logos
4. Pricing (three_tier_cards): Pricing tiers
5. CTA (centered_cta_with_background): Final conversion

### Portfolio/Agency
1. Hero (split_screen_hero): Bold statement
2. Features (feature_cards_with_hover): Services
3. Social Proof (testimonial_grid): Client testimonials
4. CTA (minimal_single_cta): Contact

### E-commerce Product
1. Hero (asymmetric_hero): Product showcase
2. Features (alternating_rows): Detailed features
3. Pricing (three_tier_cards): Product tiers
4. Social Proof (stat_counters): Social proof metrics
5. CTA (centered_cta_with_background): Purchase CTA

## Output Format

Return JSON array of sections:
\`\`\`json
{
  "sections": [
    {
      "type": "hero",
      "compositionPattern": "centered_hero_with_image",
      "content": {
        "headline": "Transform Your Analytics",
        "subheadline": "AI-powered insights for modern teams",
        "ctaPrimaryText": "Get Started Free",
        "ctaPrimaryHref": "#signup",
        "ctaSecondaryText": "Watch Demo",
        "ctaSecondaryHref": "#demo"
      },
      "imageNeeded": true,
      "imageContext": "abstract data visualization, modern tech aesthetic"
    },
    {
      "type": "features",
      "compositionPattern": "three_column_grid",
      "content": {
        "sectionHeading": "Features",
        "sectionSubheading": "Everything you need to succeed",
        "items": [
          {
            "heading": "Real-time Analytics",
            "body": "Track metrics as they happen",
            "iconNeeded": true,
            "iconContext": "analytics chart icon"
          }
        ]
      }
    }
  ]
}
\`\`\`

## Best Practices

1. **Hero First**: Always start with a hero section
2. **Vary Patterns**: Don't use same pattern for multiple sections
3. **Balance Content**: Mix text-heavy and visual sections
4. **Mobile-First Thinking**: Consider how sections stack on mobile
5. **Clear Hierarchy**: Each section should have clear purpose
6. **CTA Placement**: Include CTAs at natural decision points

## Image Context Guidelines

When identifying image needs, provide specific context:
- "abstract data visualization, blue and pink gradients, modern tech aesthetic"
- "collaborative team working, diverse professionals, clean office environment"
- NOT "nice image" (too vague)
- NOT "dashboard screenshot" (too specific/literal)

Focus on mood, composition, and visual metaphor rather than literal depictions.
`;

/**
 * Create prompt for the Content Planner agent.
 */
export function createContentPlannerPrompt(
  userRequirements: string,
  brandPersonality: string[]
): string {
  const personalityStr = brandPersonality.join(", ");

  return `
Plan the content structure and section sequence for a landing page.

# User Requirements
${userRequirements}

# Brand Personality
${personalityStr}

# Task
1. Determine optimal section sequence for this landing page
2. For each section:
   - Select appropriate composition pattern from the available patterns
   - Define content structure (headings, body, CTAs)
   - Identify image requirements with specific context
3. Return complete content structure as JSON

Consider brand personality when choosing patterns - ${personalityStr} brand should have appropriate visual rhythm and structure.

Return ONLY a valid JSON object with the sections array, no markdown code blocks, no explanations.
`;
}

/**
 * Plan content structure via Claude API.
 */
export async function planContent(
  client: Anthropic,
  designTokens: { brandPersonality: string[] },
  requirements: string
): Promise<ContentStructure> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: CONTENT_PLANNER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: createContentPlannerPrompt(
          requirements,
          designTokens.brandPersonality
        ),
      },
    ],
  });

  const responseText = extractText(response);
  const contentStructure = extractJsonFromText(responseText);

  if (!contentStructure) {
    throw new Error("ContentPlanner failed to return content structure");
  }

  return contentStructure as unknown as ContentStructure;
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
