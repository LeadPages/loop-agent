/**
 * CraftJSON Generator Agent
 *
 * Generates simplified AgentPageInput which is then expanded to full CraftJSON.
 * This agent follows a PagePlan to create structured, consistent layouts.
 */

import type {
  BrandKit,
  ContentStructure,
  UtilityClasses,
} from "../schemas";
import type { AgentPageInput, CraftJSONGenerationResult } from "../craft-json/types";
import type { PagePlan } from "./craft-json-planner";
import { DESIGN_PRINCIPLES } from "../prompts/design-principles";
import { sdkPrompt, extractJsonFromText } from "../sdk-client";
import { expandToCraftJSON, validateAgentInput } from "../craft-json/expand";
import { renderCraftJSONWithRetry } from "../craft-json/render";

/**
 * System prompt for the CraftJSON generator agent (plan-driven)
 */
export const CRAFT_JSON_GENERATOR_SYSTEM_PROMPT = `
You are a CraftJSON Generator that creates structured landing page layouts by following a detailed page plan.

## Your Role

You receive a PagePlan that specifies exactly what sections and elements to create.
Your job is to translate this plan into AgentPageInput JSON with proper styling and real content.

## Understanding CraftJSON (The Final Output Format)

CraftJSON is the serialized format used by the page builder. Understanding it helps you generate better input.

### Core Principles

1. **Flat Structure with Node IDs**: CraftJSON is a flat JSON object where each key is a unique node ID
2. **Single ROOT Node**: Every page MUST have exactly one "ROOT" key containing the Page component
3. **Container Hierarchy**: Every element (Text, Button, Image, etc.) MUST be inside a Container
4. **Parent-Child References**:
   - Each node has a \`parent\` property pointing to its parent's ID
   - Each container has a \`nodes\` array listing its children's IDs

### CraftJSON Structure Example

\`\`\`json
{
  "ROOT": {
    "type": { "resolvedName": "Page" },
    "isCanvas": true,
    "nodes": ["section_hero_abc123"],  // IDs of direct children
    "props": { ... }
  },
  "section_hero_abc123": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "parent": "ROOT",                   // References parent's ID
    "nodes": ["text_headline_xyz789", "button_cta_def456"],  // Children IDs
    "props": { ... }
  },
  "text_headline_xyz789": {
    "type": { "resolvedName": "Text" },
    "isCanvas": false,                  // Non-canvas nodes cannot have children
    "parent": "section_hero_abc123",    // References parent Container
    "nodes": [],                        // Empty - cannot have children
    "props": { ... }
  },
  "button_cta_def456": {
    "type": { "resolvedName": "Button" },
    "isCanvas": false,
    "parent": "section_hero_abc123",
    "nodes": [],
    "props": { ... }
  },
  "version": 10
}
\`\`\`

### Available Building Blocks (Components)

| Component | resolvedName | isCanvas | Description |
|-----------|--------------|----------|-------------|
| Page | "Page" | true | Root container (only one, always "ROOT") |
| Container | "Container" | true | Flexbox layout container - sections, rows, columns |
| Text | "Text" | false | Rich text with Slate.js format |
| Button | "Button" | false | Clickable button with styling |
| Image | "Image" | false | Image with fit options |
| Video | "Video" | false | YouTube/Vimeo embed |
| Form | "Form" | false | Form with fields |
| FormEmailField | "FormEmailField" | false | Email input field |
| FormTextField | "FormTextField" | false | Text input field |
| FormSubmitButton | "FormSubmitButton" | false | Form submit button |
| Countdown | "Countdown" | false | Countdown timer |

**Canvas vs Non-Canvas:**
- Canvas nodes (isCanvas: true) CAN contain children in their \`nodes\` array
- Non-canvas nodes (isCanvas: false) CANNOT have children - their \`nodes\` must be empty []

## The Simplified Structure You Generate

You generate AgentPageInput, which gets expanded to full CraftJSON automatically:

\`\`\`typescript
type AgentPageInput = {
  sections: Array<{
    sectionType: 'header' | 'hero' | 'features' | 'cta' | 'testimonials' | 'about' | 'faq' | 'contact' | 'stats' | 'pricing';  // REQUIRED: Section type for proper styling
    layout?: 'row' | 'column' | 'text-left-image-right' | 'text-right-image-left' | 'centered';  // Layout pattern
    backgroundColor?: { r: number, g: number, b: number, a: number };  // Optional section background
    elements: Array<
      | { type: 'button'; text: string; backgroundColor?: RGBA; color?: RGBA; href?: string }
      | { type: 'text'; content: string; purpose: TextPurpose; textAlign?: 'left' | 'center' | 'right'; color?: RGBA }
      | { type: 'image'; src: string; alt: string; width?: string; height?: string }
      | { type: 'video'; url: string; provider?: 'youtube' | 'vimeo' }
      | { type: 'countdown'; dateTime: string }  // ISO format
      | { type: 'form'; fields: Array<{ type: 'email' | 'text'; label?: string; placeholder?: string }>; submitText: string; submitBackgroundColor?: RGBA }
    >;
  }>;
};

// IMPORTANT: Text elements MUST include a 'purpose' field for proper typography
type TextPurpose =
  | 'headline'           // Hero main headline: 48px, bold
  | 'section-heading'    // Section titles: 36px, semibold
  | 'subheadline'        // Supporting text: 22px, normal
  | 'body-text'          // Regular paragraphs: 18px, normal
  | 'feature-title'      // Feature headings: 20px, semibold
  | 'feature-description' // Feature details: 16px, normal
  | 'testimonial-quote'  // Customer quotes: 20px, italic
  | 'testimonial-author' // Quote attribution: 16px, semibold
  | 'logo'               // Brand name: 24px, bold
  | 'stat-number'        // Statistics: 48px, bold
  | 'stat-label'         // Stat labels: 14px, medium
  | 'faq-question'       // FAQ questions: 18px, semibold
  | 'faq-answer';        // FAQ answers: 16px, normal
\`\`\`

## How Your Output Maps to CraftJSON

Each section you create becomes:
1. A Container node with unique ID, parent="ROOT", and the ROOT's nodes array includes this ID
2. Each element in the section becomes a child node with parent=container's ID

Example mapping:
\`\`\`
Your Input:                          →  CraftJSON Output:
{                                       {
  "sections": [{                          "ROOT": { nodes: ["sec_1"] },
    "sectionType": "hero",                "sec_1": {
    "elements": [                           type: "Container",
      { "type": "text", ... },              parent: "ROOT",
      { "type": "button", ... }             nodes: ["txt_1", "btn_1"]
    ]                                     },
  }]                                      "txt_1": { parent: "sec_1", nodes: [] },
}                                         "btn_1": { parent: "sec_1", nodes: [] }
                                        }
\`\`\`

## RGBA Color Format

When specifying colors, use this format:
\`\`\`json
{ "r": 0, "g": 0, "b": 0, "a": 1 }
\`\`\`
- r, g, b: 0-255
- a: 0-1 (opacity)

## Section Layout Mapping

Based on the plan's layout type, use these structures:

### Header Section
- layout: "row" (logo left, nav/CTA right)
- Elements: logo text, optional nav links, CTA button

### Hero Layouts
- **text-left-image-right**: layout: "row", text elements first, then image
- **text-right-image-left**: layout: "row", image first, then text elements
- **centered-with-background**: layout: "column", backgroundColor set, centered text
- **centered-with-form**: layout: "column", text then form
- **video-hero**: layout: "column", video element prominent
- **stats-hero**: layout: "row" for stats, then text

### Features Layouts
- **three-column-grid**: layout: "row", 3 feature groups
- **two-column-grid**: layout: "row", 2 feature groups per row
- **list-with-icons**: layout: "column", icon + text pairs
- **alternating-rows**: Multiple sections alternating layout

### Generic Sections
- **centered**: layout: "column", textAlign: "center"
- **two-column**: layout: "row"
- **full-width**: layout: "column", no max-width constraints

## Typography (Automatic via Purpose)

Typography is automatically applied based on the 'purpose' field. DO NOT manually set fontSize or fontWeight.
Just set the correct purpose and the styling is handled automatically:

- **headline**: Hero main headline (48px, bold)
- **section-heading**: Section titles like "Our Features" (36px, semibold)
- **subheadline**: Supporting text under headlines (22px, normal)
- **body-text**: Regular paragraphs (18px, normal)
- **feature-title**: Feature headings (20px, semibold)
- **feature-description**: Feature details (16px, normal)
- **testimonial-quote**: Customer quotes (20px, italic)
- **testimonial-author**: Quote attribution like "- John Doe, CEO" (16px, semibold)
- **logo**: Brand name in header (24px, bold)

## Design Principles

${DESIGN_PRINCIPLES}

## Critical Rules

1. **Follow the plan exactly** - Create sections in the order specified
2. **ALWAYS include sectionType** - Every section MUST have a sectionType field (header, hero, features, cta, etc.)
3. **ALWAYS include purpose on text elements** - This is REQUIRED for proper typography
4. **Use REAL Unsplash URLs** - Never use placeholders
   Example: \`https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop\`
5. **Apply brand colors** - Use primary for CTAs, accent for highlights
6. **Keep sections focused** - Group related elements logically
7. **Testimonials must have both quote and author** - Use "testimonial-quote" and "testimonial-author" purposes

## Output Format

Return ONLY valid JSON matching the AgentPageInput structure. No markdown, no explanation.
`;

/**
 * Convert hex color to RGBA string for prompts
 */
function hexToRgba(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `{ "r": ${parseInt(result[1], 16)}, "g": ${parseInt(result[2], 16)}, "b": ${parseInt(result[3], 16)}, "a": 1 }`;
  }
  return '{ "r": 0, "g": 0, "b": 0, "a": 1 }';
}

/**
 * Create prompt for the CraftJSON generator using a PagePlan
 */
export function createCraftJSONGeneratorPromptFromPlan(
  pagePlan: PagePlan,
  brandKit: BrandKit
): string {
  // Format the plan sections for the prompt
  const planSectionsText = pagePlan.sections.map((section, index) => {
    const elementsText = section.elements
      .map(el => `    - ${el.type} (${el.purpose})${el.content ? `: "${el.content}"` : ""}`)
      .join("\n");

    return `${index + 1}. **${section.type.toUpperCase()}** (layout: ${section.layout})
${section.backgroundColor ? `   Background: ${section.backgroundColor}` : ""}
   Elements:
${elementsText}
${section.notes ? `   Notes: ${section.notes}` : ""}`;
  }).join("\n\n");

  return `
Generate AgentPageInput JSON following this exact page plan.

## Brand Colors (use these!)
- **Primary:** ${brandKit.colors.primary} → ${hexToRgba(brandKit.colors.primary)}
- **Secondary:** ${brandKit.colors.secondary} → ${hexToRgba(brandKit.colors.secondary)}
- **Accent:** ${brandKit.colors.accent} → ${hexToRgba(brandKit.colors.accent)}
- **Text (dark):** { "r": 31, "g": 41, "b": 55, "a": 1 }
- **Text (light):** { "r": 255, "g": 255, "b": 255, "a": 1 }

## Brand Info
- **Name:** ${brandKit.name}
- **Tagline:** ${brandKit.businessInfo?.tagline || "Welcome"}
- **Services:** ${brandKit.businessInfo?.services?.join(", ") || "Professional services"}

## Color Strategy
- Hero background: ${pagePlan.colorStrategy.heroBackground || "white/transparent"}
- Alternating backgrounds: ${pagePlan.colorStrategy.alternatingBackgrounds ? "Yes - use subtle gray (#F9FAFB) for alternating sections" : "No"}
- Accent usage: ${pagePlan.colorStrategy.accentUsage}

## Typography Notes
${pagePlan.typographyNotes}

## PAGE PLAN - Follow This Exactly

${planSectionsText}

## Your Task

Create an AgentPageInput with exactly ${pagePlan.sections.length} sections matching the plan above.

For each section:
1. Set the correct layout ("row" or "column") based on the plan's layout type
2. Create elements matching the plan's element list
3. Apply appropriate typography (headlines large, body small)
4. Use brand primary color for CTA buttons
5. Use real Unsplash URLs for images (search terms: ${brandKit.businessInfo?.services?.join(", ") || "business"})

For row layouts with text and image:
- Group text elements together conceptually
- Image should be full-width of its half

Return ONLY the JSON object.
`;
}

/**
 * Legacy prompt creator (for backward compatibility)
 */
export function createCraftJSONGeneratorPrompt(
  contentStructure: ContentStructure & { heroLayout?: string },
  utilityClasses: UtilityClasses,
  brandKit: BrandKit,
  heroLayoutId: string
): string {
  return `
Generate a landing page structure as AgentPageInput JSON.

# Brand Kit
- **Name:** ${brandKit.name}
- **Tagline:** ${brandKit.businessInfo?.tagline || "Welcome"}
- **Primary Color:** ${brandKit.colors.primary} → ${hexToRgba(brandKit.colors.primary)}
- **Secondary Color:** ${brandKit.colors.secondary} → ${hexToRgba(brandKit.colors.secondary)}
- **Accent Color:** ${brandKit.colors.accent} → ${hexToRgba(brandKit.colors.accent)}
- **Personality:** ${brandKit.personalityTraits.join(", ")}

# Hero Layout to Use: ${heroLayoutId}

# Content Structure
\`\`\`json
${JSON.stringify(contentStructure, null, 2)}
\`\`\`

# Required Sections

1. **Header** - Brand logo and optional CTA
2. **Hero** - Main headline, subheadline, CTA button, image
3. **Features** - 3-4 key benefits or features
4. **CTA** - Final call-to-action

# Important
- Use brand primary color for main buttons
- Use real Unsplash image URLs
- Return ONLY JSON, no explanation

Return ONLY the JSON object.
`;
}

/**
 * Strip markdown code fences from text
 */
function stripMarkdownCodeFences(text: string): string {
  // Remove leading ```json or ``` and trailing ```
  let cleaned = text.trim();

  // Remove opening code fence
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  // Remove closing code fence
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}

/**
 * Try to parse JSON directly, with better error reporting
 */
function tryParseJSON(text: string): { parsed: unknown; error?: string } {
  // First try direct parse
  try {
    return { parsed: JSON.parse(text) };
  } catch {
    // Try stripping markdown code fences
  }

  // Try after stripping code fences
  const stripped = stripMarkdownCodeFences(text);
  try {
    return { parsed: JSON.parse(stripped) };
  } catch (e) {
    return { parsed: null, error: e instanceof Error ? e.message : "Unknown parse error" };
  }
}

/**
 * Generate CraftJSON using a PagePlan (new approach)
 */
export async function generateCraftJSONFromPlan(
  pagePlan: PagePlan,
  brandKit: BrandKit,
  model?: string
): Promise<CraftJSONGenerationResult> {
  // Step 1: Get simplified structure from agent using the plan
  const responseText = await sdkPrompt(
    createCraftJSONGeneratorPromptFromPlan(pagePlan, brandKit),
    { systemPrompt: CRAFT_JSON_GENERATOR_SYSTEM_PROMPT, model }
  );

  // Step 2: Parse agent output
  const directParse = tryParseJSON(responseText);
  let agentInput: Record<string, unknown> | null = directParse.parsed as Record<string, unknown>;

  if (!agentInput) {
    console.error("[CraftJSONGenerator] Direct JSON parse failed:", directParse.error);
    agentInput = extractJsonFromText(responseText);
  }

  if (!agentInput) {
    console.error("[CraftJSONGenerator] Failed to extract JSON from response");
    console.error("[CraftJSONGenerator] Response length:", responseText?.length || 0);
    console.error("[CraftJSONGenerator] Response start:", responseText?.substring(0, 200) || "(empty)");
    console.error("[CraftJSONGenerator] Response end:", responseText?.slice(-200) || "(empty)");
    throw new Error("CraftJSON Generator failed to return valid JSON");
  }

  if (!validateAgentInput(agentInput)) {
    console.error("[CraftJSONGenerator] JSON validation failed");
    console.error("[CraftJSONGenerator] Has sections?", "sections" in agentInput);
    console.error("[CraftJSONGenerator] sections type:", Array.isArray(agentInput.sections) ? "array" : typeof agentInput.sections);
    throw new Error("CraftJSON Generator returned invalid AgentPageInput structure");
  }

  // Step 3: Expand to full CraftJSON
  const craftJSON = expandToCraftJSON(agentInput as AgentPageInput);

  // Step 4: Render to HTML via backend API
  const renderResult = await renderCraftJSONWithRetry(craftJSON);

  if (renderResult.error) {
    console.error("[CraftJSONGenerator] Render failed:", renderResult.error);
    return {
      craftJSON,
      agentInput: agentInput as AgentPageInput,
      html: "",
      sections: pagePlan.sections.map(s => s.type),
    };
  }

  return {
    craftJSON,
    agentInput: agentInput as AgentPageInput,
    html: renderResult.html,
    sections: pagePlan.sections.map(s => s.type),
  };
}

/**
 * Generate CraftJSON via the agent and utility layer (legacy)
 */
export async function generateCraftJSON(
  utilityClasses: UtilityClasses,
  contentStructure: ContentStructure & { heroLayout?: string },
  brandKit: BrandKit,
  heroLayoutId: string,
  model?: string
): Promise<CraftJSONGenerationResult> {
  // Step 1: Get simplified structure from agent
  const responseText = await sdkPrompt(
    createCraftJSONGeneratorPrompt(contentStructure, utilityClasses, brandKit, heroLayoutId),
    { systemPrompt: CRAFT_JSON_GENERATOR_SYSTEM_PROMPT, model }
  );

  // Step 2: Parse agent output
  const directParse = tryParseJSON(responseText);
  let agentInput: Record<string, unknown> | null = directParse.parsed as Record<string, unknown>;

  if (!agentInput) {
    console.error("[CraftJSONGenerator] Direct JSON parse failed:", directParse.error);
    agentInput = extractJsonFromText(responseText);
  }

  if (!agentInput) {
    console.error("[CraftJSONGenerator] Failed to extract JSON from response");
    console.error("[CraftJSONGenerator] Response length:", responseText?.length || 0);
    console.error("[CraftJSONGenerator] Response start:", responseText?.substring(0, 200) || "(empty)");
    console.error("[CraftJSONGenerator] Response end:", responseText?.slice(-200) || "(empty)");
    throw new Error("CraftJSON Generator failed to return valid JSON");
  }

  if (!validateAgentInput(agentInput)) {
    console.error("[CraftJSONGenerator] JSON validation failed");
    console.error("[CraftJSONGenerator] Has sections?", "sections" in agentInput);
    throw new Error("CraftJSON Generator returned invalid AgentPageInput structure");
  }

  // Step 3: Expand to full CraftJSON
  const craftJSON = expandToCraftJSON(agentInput as AgentPageInput);

  // Step 4: Render to HTML via backend API
  const renderResult = await renderCraftJSONWithRetry(craftJSON);

  if (renderResult.error) {
    console.error("[CraftJSONGenerator] Render failed:", renderResult.error);
    return {
      craftJSON,
      agentInput: agentInput as AgentPageInput,
      html: "",
      sections: contentStructure.sections.map(s => s.type),
    };
  }

  return {
    craftJSON,
    agentInput: agentInput as AgentPageInput,
    html: renderResult.html,
    sections: contentStructure.sections.map(s => s.type),
  };
}
