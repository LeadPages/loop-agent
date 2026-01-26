/**
 * CraftJSON Planner Agent
 *
 * Plans the page structure before CraftJSON generation.
 * Determines section layout and element composition based on brand kit and requirements.
 */

import type { BrandKit, ContentStructure } from "../schemas";
import { sdkPrompt, extractJsonFromText } from "../sdk-client";

/**
 * Section types that can appear in a landing page
 */
export type SectionType =
  | "header"
  | "hero"
  | "features"
  | "about"
  | "event"
  | "faq"
  | "cta"
  | "contact"
  | "testimonials"
  | "pricing"
  | "stats";

/**
 * Layout patterns for different section types
 */
export type HeroLayout =
  | "text-left-image-right"
  | "text-right-image-left"
  | "centered-with-background"
  | "centered-with-form"
  | "video-hero"
  | "stats-hero";

export type FeaturesLayout =
  | "three-column-grid"
  | "two-column-grid"
  | "list-with-icons"
  | "alternating-rows";

export type GenericLayout =
  | "centered"
  | "two-column"
  | "full-width";

/**
 * Element purposes within sections
 */
export type ElementPurpose =
  | "logo"
  | "nav-links"
  | "headline"
  | "subheadline"
  | "body-text"
  | "hero-image"
  | "background-image"
  | "cta-button"
  | "secondary-button"
  | "form"
  | "feature-title"
  | "feature-description"
  | "feature-icon"
  | "testimonial-quote"
  | "testimonial-author"
  | "stat-number"
  | "stat-label"
  | "faq-question"
  | "faq-answer";

/**
 * Planned element within a section
 */
export interface PlannedElement {
  type: "text" | "image" | "button" | "form" | "video" | "countdown";
  purpose: ElementPurpose;
  content?: string; // Suggested content or description
}

/**
 * Planned section in the page
 */
export interface PlannedSection {
  type: SectionType;
  layout: HeroLayout | FeaturesLayout | GenericLayout | string;
  backgroundColor?: string; // hex color if section needs background
  elements: PlannedElement[];
  notes?: string; // Additional guidance for the generator
}

/**
 * Complete page plan
 */
export interface PagePlan {
  sections: PlannedSection[];
  colorStrategy: {
    heroBackground?: string;
    alternatingBackgrounds: boolean;
    accentUsage: string;
  };
  typographyNotes: string;
}

/**
 * System prompt for the CraftJSON planner agent
 */
export const CRAFT_JSON_PLANNER_SYSTEM_PROMPT = `
You are a Landing Page Structure Planner. You create concise page plans with EXACTLY 4-5 sections.

## CRITICAL CONSTRAINT: MAXIMUM 5 SECTIONS

A landing page must have EXACTLY 4 or 5 sections total. No more, no less.

**Standard 4-section page:**
1. header
2. hero
3. features
4. cta

**Extended 5-section page (only if needed):**
1. header
2. hero
3. features
4. ONE optional section (testimonials OR about OR faq - pick ONE)
5. cta

## Section Definitions

### 1. header (REQUIRED)
- Logo text
- Optional CTA button
- layout: "row"

### 2. hero (REQUIRED)
- Headline, subheadline, CTA button, image
- layout: "text-left-image-right" or "centered"

### 3. features (REQUIRED)
- Section heading
- 3 feature items (each with title + description)
- ALL features go in ONE section, not separate sections
- layout: "centered"

### 4. Optional section (pick AT MOST one):
- **testimonials**: 1-2 customer quotes with attribution (each needs testimonial-quote AND testimonial-author elements)
- **about**: Brief company/founder story
- **faq**: 2-3 common questions

### 5. cta (REQUIRED as final section)
- Final headline + CTA button or form
- layout: "centered"

## Output Format

\`\`\`json
{
  "sections": [
    {
      "type": "header",
      "layout": "row",
      "elements": [
        { "type": "text", "purpose": "logo", "content": "Brand Name" },
        { "type": "button", "purpose": "cta-button", "content": "Get Started" }
      ]
    },
    {
      "type": "hero",
      "layout": "text-left-image-right",
      "elements": [
        { "type": "text", "purpose": "headline", "content": "Main headline" },
        { "type": "text", "purpose": "subheadline", "content": "Supporting text" },
        { "type": "button", "purpose": "cta-button", "content": "CTA" },
        { "type": "image", "purpose": "hero-image" }
      ]
    },
    {
      "type": "features",
      "layout": "centered",
      "elements": [
        { "type": "text", "purpose": "headline", "content": "Section heading" },
        { "type": "text", "purpose": "feature-title", "content": "Feature 1" },
        { "type": "text", "purpose": "feature-description", "content": "Description 1" },
        { "type": "text", "purpose": "feature-title", "content": "Feature 2" },
        { "type": "text", "purpose": "feature-description", "content": "Description 2" },
        { "type": "text", "purpose": "feature-title", "content": "Feature 3" },
        { "type": "text", "purpose": "feature-description", "content": "Description 3" }
      ]
    },
    {
      "type": "cta",
      "layout": "centered",
      "elements": [
        { "type": "text", "purpose": "headline", "content": "Ready to get started?" },
        { "type": "button", "purpose": "cta-button", "content": "Sign Up Now" }
      ]
    }
  ],
  "colorStrategy": {
    "heroBackground": null,
    "alternatingBackgrounds": false,
    "accentUsage": "Primary buttons only"
  },
  "typographyNotes": "Bold headlines, clean body text"
}
\`\`\`

## Example Testimonials Section (when included as 5th section)

\`\`\`json
{
  "type": "testimonials",
  "layout": "centered",
  "elements": [
    { "type": "text", "purpose": "headline", "content": "What Our Customers Say" },
    { "type": "text", "purpose": "testimonial-quote", "content": "This product changed my life! Highly recommend." },
    { "type": "text", "purpose": "testimonial-author", "content": "— Jane Smith, CEO at TechCorp" },
    { "type": "text", "purpose": "testimonial-quote", "content": "Excellent service and amazing results." },
    { "type": "text", "purpose": "testimonial-author", "content": "— John Doe, Founder at StartupXYZ" }
  ]
}
\`\`\`

## Rules

1. MAXIMUM 5 SECTIONS - never exceed this
2. Each section type appears ONCE only
3. All features go in ONE features section
4. Testimonials MUST have both quote AND author for each testimonial
5. Return ONLY JSON - no markdown or explanations
`;

/**
 * Create prompt for the planner agent
 */
export function createPlannerPrompt(
  brandKit: BrandKit,
  requirements: string,
  contentStructure?: ContentStructure
): string {
  return `
Plan a landing page structure for the following business:

## Brand Information
- **Name:** ${brandKit.name}
- **Tagline:** ${brandKit.businessInfo?.tagline || "N/A"}
- **Services:** ${brandKit.businessInfo?.services?.join(", ") || "N/A"}

## Brand Colors
- **Primary:** ${brandKit.colors.primary}
- **Secondary:** ${brandKit.colors.secondary}
- **Accent:** ${brandKit.colors.accent}

## Brand Personality
${brandKit.personalityTraits.join(", ")}

## User Requirements
${requirements}

${contentStructure ? `
## Content Guidance (from content planner)
- Sections planned: ${contentStructure.sections.map(s => s.type).join(", ")}
${contentStructure.sections.map(s => `- ${s.type}: ${s.content.headline || s.content.sectionHeading || ""}`).join("\n")}
` : ""}

## Your Task

Create a page plan with EXACTLY 4 or 5 sections:
- header (required)
- hero (required)
- features (required)
- ONE optional section if appropriate (testimonials, about, or faq)
- cta (required as final section)

MAXIMUM 5 SECTIONS. Return ONLY JSON.
`;
}

/**
 * Maximum allowed sections in a page plan
 */
const MAX_SECTIONS = 5;

/**
 * Validate the page plan structure
 */
export function validatePagePlan(input: unknown): input is PagePlan {
  if (!input || typeof input !== "object") {
    return false;
  }

  const obj = input as Record<string, unknown>;

  if (!Array.isArray(obj.sections)) {
    return false;
  }

  // Check for required sections
  const sectionTypes = obj.sections.map((s: { type?: string }) => s.type);
  const hasHeader = sectionTypes.includes("header");
  const hasHero = sectionTypes.includes("hero");
  const hasFeatures = sectionTypes.includes("features");
  const hasCta = sectionTypes.includes("cta");

  if (!hasHeader || !hasHero || !hasFeatures || !hasCta) {
    console.warn("[CraftJSONPlanner] Missing required sections:", {
      hasHeader,
      hasHero,
      hasFeatures,
      hasCta,
    });
    return false;
  }

  // Validate each section has elements
  for (const section of obj.sections) {
    const sec = section as Record<string, unknown>;
    if (!sec.type || !sec.layout || !Array.isArray(sec.elements)) {
      return false;
    }
  }

  return true;
}

/**
 * Enforce section limits on a page plan.
 * Keeps required sections (header, hero, features, cta) and trims extras.
 */
function enforceSectionLimits(plan: PagePlan): PagePlan {
  if (plan.sections.length <= MAX_SECTIONS) {
    return plan;
  }

  console.warn(`[CraftJSONPlanner] Plan has ${plan.sections.length} sections, trimming to ${MAX_SECTIONS}`);

  // Priority order for keeping sections
  const priority = ["header", "hero", "features", "cta", "testimonials", "about", "faq", "contact", "stats", "pricing", "event"];

  // Sort sections by priority, keeping original order within same priority
  const sorted = [...plan.sections].sort((a, b) => {
    const aIndex = priority.indexOf(a.type);
    const bIndex = priority.indexOf(b.type);
    const aPriority = aIndex === -1 ? 999 : aIndex;
    const bPriority = bIndex === -1 ? 999 : bIndex;
    return aPriority - bPriority;
  });

  // Keep only top MAX_SECTIONS
  const kept = sorted.slice(0, MAX_SECTIONS);

  // Re-sort to original order (header first, cta last)
  const final = kept.sort((a, b) => {
    if (a.type === "header") return -1;
    if (b.type === "header") return 1;
    if (a.type === "cta") return 1;
    if (b.type === "cta") return -1;
    return 0;
  });

  return {
    ...plan,
    sections: final,
  };
}

/**
 * Generate a page plan
 */
export async function generatePagePlan(
  brandKit: BrandKit,
  requirements: string,
  contentStructure?: ContentStructure,
  model?: string
): Promise<PagePlan> {
  const responseText = await sdkPrompt(
    createPlannerPrompt(brandKit, requirements, contentStructure),
    { systemPrompt: CRAFT_JSON_PLANNER_SYSTEM_PROMPT, model }
  );

  // Try to parse the response
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    parsed = extractJsonFromText(responseText);
  }

  if (!parsed) {
    console.error("[CraftJSONPlanner] Failed to parse response");
    console.error("[CraftJSONPlanner] Response:", responseText?.substring(0, 500));
    throw new Error("CraftJSON Planner failed to return valid JSON");
  }

  if (!validatePagePlan(parsed)) {
    console.error("[CraftJSONPlanner] Invalid plan structure");
    console.error("[CraftJSONPlanner] Parsed:", JSON.stringify(parsed).substring(0, 500));
    throw new Error("CraftJSON Planner returned invalid page plan structure");
  }

  // Enforce section limits (max 5 sections)
  return enforceSectionLimits(parsed);
}
