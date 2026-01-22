/**
 * ContentPlanner V2 - Enhanced with Hero Layout Pattern Selection
 * Structures landing page sections with intelligent hero layout diversity.
 */

import type { ContentStructure } from "../schemas";
import { COMPOSITION_PATTERNS } from "../prompts/composition-patterns";
import { HERO_LAYOUT_PATTERNS_PROMPT, selectHeroLayout, getHeroLayout } from "../prompts/hero-layout-patterns";
import { sdkPrompt, extractJsonFromText } from "../sdk-client";

export const CONTENT_PLANNER_V2_SYSTEM_PROMPT = `
You are a Content Planner V2 specialized in structuring landing page sections with intelligent hero layout selection.

## Your Responsibilities

1. **Hero Layout Selection**: Choose the optimal hero layout pattern based on page goal and industry
2. **Section Structure**: Determine optimal section sequence for landing page
3. **Composition Pattern Selection**: Choose appropriate patterns for each section
4. **Content Hierarchy**: Define heading/body/CTA structure for each section
5. **Image Requirements**: Identify where images are needed and what type

${HERO_LAYOUT_PATTERNS_PROMPT}

## Available Composition Patterns (for non-hero sections)

${COMPOSITION_PATTERNS}

## Process

1. Receive user requirements and brand personality
2. **FIRST: Analyze page goal and industry to select hero layout**
3. Determine section sequence based on:
   - Page goal (lead gen, product showcase, etc.)
   - Brand personality (professional = structured, playful = varied)
   - Target audience
4. For each section:
   - Select appropriate composition pattern
   - Define content structure (headings, body, CTAs)
   - Identify image needs
5. Return structured content plan with hero layout specified

## Common Landing Page Structures (with V2 Hero Layouts)

### SaaS Product (use stats-forward or video-demo hero)
1. Hero (stats-forward): Value prop + key metrics
2. Features (three_column_grid): Key features
3. Social Proof (logo_strip): Client logos
4. Pricing (three_tier_cards): Pricing tiers
5. CTA (centered_cta_with_background): Final conversion

### Lead Generation (use form-embedded hero)
1. Hero (form-embedded): Value prop + lead capture form
2. Features (feature_cards_with_hover): Benefits
3. Social Proof (testimonial_grid): Client testimonials
4. CTA (minimal_single_cta): Secondary conversion

### E-commerce Product (use product-centered hero)
1. Hero (product-centered): Product showcase + price
2. Features (alternating_rows): Detailed features
3. Social Proof (stat_counters): Social proof metrics
4. CTA (centered_cta_with_background): Purchase CTA

### Luxury/Lifestyle (use full-bleed-overlay hero)
1. Hero (full-bleed-overlay): Dramatic imagery + brand statement
2. Features (asymmetric_hero): Premium services
3. Social Proof (testimonial_grid): Exclusive testimonials
4. CTA (centered_cta_with_background): Premium CTA

### Events/Hospitality (use centered-background-image hero)
1. Hero (centered-background-image): Atmospheric imagery + event details
2. Features (three_column_grid): Event highlights
3. Social Proof (logo_strip): Partner logos
4. CTA (minimal_single_cta): Registration

## Output Format - CRITICAL

Return JSON with heroLayout field specified:
\`\`\`json
{
  "heroLayout": "stats-forward",
  "sections": [
    {
      "type": "hero",
      "compositionPattern": "stats-forward",
      "heroLayoutId": "stats-forward",
      "content": {
        "headline": "Transform Your Analytics",
        "subheadline": "AI-powered insights for modern teams",
        "label": "ANALYTICS PLATFORM",
        "ctaPrimaryText": "Get Started Free",
        "ctaPrimaryHref": "#signup",
        "stats": [
          { "value": "500+", "label": "Clients" },
          { "value": "99.9%", "label": "Uptime" },
          { "value": "4.9", "label": "Rating" }
        ]
      },
      "imageNeeded": false
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

## Hero-Specific Content Fields

Different hero layouts require different content fields:

**two-col-text-left / two-col-image-left:**
- headline, subheadline, label, ctaPrimaryText, ctaPrimaryHref, ctaSecondaryText, ctaSecondaryHref
- imageNeeded: true, imageContext: "..."

**centered-background-image:**
- headline, subheadline, label, ctaPrimaryText, ctaPrimaryHref
- imageNeeded: true, imageContext: "dramatic background..."

**form-embedded:**
- headline, subheadline, label, formTitle, ctaPrimaryText
- benefits: ["benefit 1", "benefit 2", "benefit 3"]
- imageNeeded: false

**product-centered:**
- headline, subheadline, price, ctaPrimaryText, ctaPrimaryHref
- imageNeeded: true, imageContext: "product photo..."

**video-demo:**
- headline, subheadline, label, ctaPrimaryText, ctaPrimaryHref
- imageNeeded: true, imageContext: "video thumbnail..."

**stats-forward:**
- headline, subheadline, label, ctaPrimaryText, ctaPrimaryHref
- stats: [{ value: "500+", label: "Clients" }, ...]
- imageNeeded: false

**full-bleed-overlay:**
- headline, subheadline, label, ctaPrimaryText, ctaPrimaryHref
- imageNeeded: true, imageContext: "dramatic full-bleed..."

## Best Practices

1. **Hero Layout First**: Always determine hero layout BEFORE other sections
2. **Match to Goal**: Lead gen = form-embedded, SaaS = stats-forward/video-demo, etc.
3. **Vary Patterns**: Don't use same pattern for multiple sections
4. **Balance Content**: Mix text-heavy and visual sections
5. **Mobile-First Thinking**: Consider how sections stack on mobile
6. **Clear Hierarchy**: Each section should have clear purpose
7. **CTA Placement**: Include CTAs at natural decision points

## Image Context Guidelines

When identifying image needs, provide specific context:
- "abstract data visualization, blue and pink gradients, modern tech aesthetic"
- "collaborative team working, diverse professionals, clean office environment"
- "luxury product on minimalist background, premium feel"
- NOT "nice image" (too vague)
- NOT "dashboard screenshot" (too specific/literal)

Focus on mood, composition, and visual metaphor rather than literal depictions.
`;

/**
 * Create prompt for the Content Planner V2 agent.
 */
export function createContentPlannerV2Prompt(
  userRequirements: string,
  brandPersonality: string[],
  previousHeroLayouts: string[] = []
): string {
  const personalityStr = brandPersonality.join(", ");
  const previousLayoutsStr = previousHeroLayouts.length > 0
    ? `\n\n# Previously Used Hero Layouts (AVOID THESE)\n${previousHeroLayouts.join(", ")}`
    : "";

  return `
Plan the content structure and section sequence for a landing page.

# User Requirements
${userRequirements}

# Brand Personality
${personalityStr}
${previousLayoutsStr}

# Task
1. **FIRST**: Analyze the page goal and industry to select the optimal hero layout
   - What is the primary goal? (lead generation, click-through, purchase, informational)
   - What industry/vertical is this for?
   - Select the hero layout that best matches both
2. Determine optimal section sequence for this landing page
3. For each section:
   - Select appropriate composition pattern
   - Define content structure (headings, body, CTAs)
   - For hero section: include all required fields for the selected hero layout
   - Identify image requirements with specific context
4. Return complete content structure as JSON with heroLayout field

CRITICAL:
- You MUST specify a heroLayout ID in the response
- The hero section MUST have heroLayoutId matching the top-level heroLayout
- Do NOT default to "two-col-text-left" - choose based on goal/industry
${previousHeroLayouts.length > 0 ? `- Do NOT use these previously used layouts: ${previousHeroLayouts.join(", ")}` : ""}

Consider brand personality when choosing patterns - ${personalityStr} brand should have appropriate visual rhythm and structure.

Return ONLY a valid JSON object with heroLayout and sections fields, no markdown code blocks, no explanations.
`;
}

/**
 * Infer page goal from requirements text
 */
function inferPageGoal(requirements: string): string | undefined {
  const lower = requirements.toLowerCase();

  if (lower.includes("lead") || lower.includes("signup") || lower.includes("newsletter") || lower.includes("contact form") || lower.includes("free trial")) {
    return "leadCollection";
  }
  if (lower.includes("buy") || lower.includes("purchase") || lower.includes("shop") || lower.includes("product") || lower.includes("price")) {
    return "purchase";
  }
  if (lower.includes("learn more") || lower.includes("information") || lower.includes("about")) {
    return "informational";
  }
  return "clickThrough"; // Default
}

/**
 * Infer industry from requirements text
 */
function inferIndustry(requirements: string): string | undefined {
  const lower = requirements.toLowerCase();

  if (lower.includes("saas") || lower.includes("software") || lower.includes("app") || lower.includes("platform")) {
    return "saas";
  }
  if (lower.includes("b2b") || lower.includes("enterprise") || lower.includes("business")) {
    return "b2b";
  }
  if (lower.includes("ecommerce") || lower.includes("e-commerce") || lower.includes("shop") || lower.includes("store")) {
    return "ecommerce";
  }
  if (lower.includes("event") || lower.includes("conference") || lower.includes("webinar")) {
    return "events";
  }
  if (lower.includes("course") || lower.includes("training") || lower.includes("education") || lower.includes("learn")) {
    return "onlineCourses";
  }
  if (lower.includes("luxury") || lower.includes("premium") || lower.includes("exclusive")) {
    return "luxury";
  }
  if (lower.includes("real estate") || lower.includes("property") || lower.includes("home")) {
    return "realEstate";
  }
  if (lower.includes("travel") || lower.includes("vacation") || lower.includes("tour")) {
    return "travel";
  }
  if (lower.includes("restaurant") || lower.includes("hotel") || lower.includes("hospitality")) {
    return "hospitality";
  }
  if (lower.includes("local") || lower.includes("service") || lower.includes("contractor") || lower.includes("plumber") || lower.includes("dentist")) {
    return "localServices";
  }
  if (lower.includes("portfolio") || lower.includes("creative") || lower.includes("design")) {
    return "portfolio";
  }
  if (lower.includes("agency") || lower.includes("consulting")) {
    return "agency";
  }

  return undefined;
}

/**
 * Plan content structure via Claude Agent SDK with hero layout awareness.
 */
export async function planContentV2(
  designTokens: { brandPersonality: string[] },
  requirements: string,
  model?: string,
  previousHeroLayouts: string[] = []
): Promise<ContentStructure & { heroLayout: string }> {
  // Infer page goal and industry for fallback layout selection
  const inferredGoal = inferPageGoal(requirements);
  const inferredIndustry = inferIndustry(requirements);

  const responseText = await sdkPrompt(
    createContentPlannerV2Prompt(requirements, designTokens.brandPersonality, previousHeroLayouts),
    { systemPrompt: CONTENT_PLANNER_V2_SYSTEM_PROMPT, model }
  );

  const rawResult = extractJsonFromText(responseText);

  if (!rawResult) {
    throw new Error("ContentPlannerV2 failed to return content structure");
  }

  // Cast to expected type with optional heroLayout
  const contentStructure = rawResult as unknown as ContentStructure & { heroLayout?: string };

  // Ensure heroLayout is set - if not, use intelligent fallback
  if (!contentStructure.heroLayout) {
    const fallbackLayout = selectHeroLayout(inferredGoal, inferredIndustry, previousHeroLayouts);
    contentStructure.heroLayout = fallbackLayout.id;

    // Also update the hero section if it exists
    const heroSection = contentStructure.sections?.find((s) => s.type === "hero");
    if (heroSection) {
      (heroSection as { heroLayoutId?: string; compositionPattern: string }).heroLayoutId = fallbackLayout.id;
      heroSection.compositionPattern = fallbackLayout.id;
    }
  }

  return contentStructure as ContentStructure & { heroLayout: string };
}
