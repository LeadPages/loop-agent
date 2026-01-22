/**
 * HTMLGenerator V2 - Builds HTML with hero layout pattern awareness.
 * Enhanced version that implements the 8 hero layout patterns.
 */

import type {
  BrandKit,
  ContentStructure,
  UtilityClasses,
  HTMLGenerationResult,
} from "../schemas";
import { RESPONSIVE_GUIDELINES } from "../prompts/responsive-guidelines";
import { DESIGN_PRINCIPLES } from "../prompts/design-principles";
import { HERO_LAYOUTS, getHeroLayout } from "../prompts/hero-layout-patterns";
import { sdkPrompt, extractJsonFromText } from "../sdk-client";

/**
 * Generate hero layout implementation instructions based on layout ID
 */
function getHeroLayoutInstructions(layoutId: string): string {
  const layout = getHeroLayout(layoutId);
  if (!layout) {
    return "Use a standard two-column layout with text left and image right.";
  }

  return `
## HERO LAYOUT: ${layout.name}

${layout.description}

**Best for:** ${layout.bestFor.join(", ")}

### HTML Structure Reference:
\`\`\`html
${layout.htmlStructure}
\`\`\`

### Implementation Notes:
- CSS Pattern: ${layout.cssPattern}
- Replace all {{PLACEHOLDER}} tokens with actual content from the content structure
- Ensure the layout is fully responsive (mobile-first)
- Apply brand colors and fonts consistently
`;
}

export const HTML_GENERATOR_V2_SYSTEM_PROMPT = `
You are an HTML Generator V2 specialized in building landing pages with hero layout pattern diversity.

## CRITICAL CONSTRAINT

You can ONLY use these HTML elements:
- \`<div>\` - For containers, sections, text blocks
- \`<img>\` - For images (self-closing)
- \`<a>\` - For links
- \`<button>\` - For buttons

ANY OTHER ELEMENT WILL BE REJECTED by the element whitelist hook.

## Your Responsibilities (V2 Enhanced)

1. **Hero Layout Implementation**: Build the hero section using the SPECIFIED layout pattern
2. **HTML Construction**: Build HTML using only allowed elements
3. **Tailwind Application**: Apply utility classes from Design System
4. **Composition Patterns**: Follow pattern guidelines from Content Planner
5. **Responsive Design**: Implement mobile-first responsive patterns
6. **Accessibility**: Proper alt text, button labels, ARIA attributes

## Hero Layout Patterns Reference

${HERO_LAYOUTS.map(l => `- **${l.id}**: ${l.name} - ${l.description}`).join("\n")}

## Design Principles - CRITICAL (Anti-AI-Slop)

${DESIGN_PRINCIPLES}

## Responsive Guidelines

${RESPONSIVE_GUIDELINES}

## Process

1. Receive:
   - Content structure from Content Planner (includes heroLayoutId)
   - Utility classes from Design System
   - Brand Kit with colors and fonts
   - **SPECIFIC HERO LAYOUT to implement**
2. **FIRST: Implement the hero section using the specified layout pattern**
3. For remaining sections:
   - Reference composition pattern for structure
   - Build HTML using only div/img/a/button
   - Apply utility classes from Design System
   - Implement mobile-first responsive classes
   - Use real Unsplash URLs for images
4. Assemble sections into complete HTML document
5. Return complete, styled HTML

## HTML Document Structure - CRITICAL

Your HTML MUST include this exact structure with Tailwind config and CSS reset:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - Tagline</title>

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Tailwind Config - REQUIRED for brand colors -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: 'PRIMARY_COLOR',
                        secondary: 'SECONDARY_COLOR',
                        accent: 'ACCENT_COLOR',
                    }
                }
            }
        }
    </script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=HEADING_FONT:wght@400;500;600;700&family=BODY_FONT:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- Custom Styles with CSS Reset -->
    <style>
        /* CSS Reset */
        *, *::before, *::after { box-sizing: border-box; }
        * { margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { min-height: 100vh; line-height: 1.5; -webkit-font-smoothing: antialiased; }
        img, picture, video, canvas, svg { display: block; max-width: 100%; }
        button { cursor: pointer; }

        /* Font Classes */
        .font-heading { font-family: 'HEADING_FONT', sans-serif; }
        .font-body { font-family: 'BODY_FONT', sans-serif; }
    </style>
</head>
<body class="font-body bg-white text-gray-900">
    <!-- sections here -->
</body>
</html>
\`\`\`

## Hero Layout Implementation Examples

### stats-forward Hero
\`\`\`html
<div class="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <div class="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full font-semibold text-sm tracking-wide uppercase">LABEL</div>
    <div class="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">Headline Here</div>
    <div class="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mt-6">Subheadline text here</div>
    <!-- Stats Row -->
    <div class="grid grid-cols-3 gap-8 mt-12 py-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div class="text-center">
        <div class="font-heading text-4xl md:text-5xl font-bold text-primary">500+</div>
        <div class="text-gray-600 mt-1">Clients</div>
      </div>
      <div class="text-center">
        <div class="font-heading text-4xl md:text-5xl font-bold text-primary">99.9%</div>
        <div class="text-gray-600 mt-1">Uptime</div>
      </div>
      <div class="text-center">
        <div class="font-heading text-4xl md:text-5xl font-bold text-primary">4.9</div>
        <div class="text-gray-600 mt-1">Rating</div>
      </div>
    </div>
    <div class="mt-10">
      <a href="#signup" class="inline-flex items-center justify-center bg-primary text-white px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">Get Started</a>
    </div>
  </div>
</div>
\`\`\`

### form-embedded Hero
\`\`\`html
<div class="py-16 md:py-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <!-- Text Column -->
      <div>
        <div class="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full font-semibold text-sm tracking-wide uppercase">LABEL</div>
        <div class="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">Headline Here</div>
        <div class="text-lg md:text-xl text-gray-600 leading-relaxed mt-6">Subheadline text</div>
        <div class="mt-8 space-y-3">
          <div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full bg-primary"></div><div class="text-gray-700">Benefit 1</div></div>
          <div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full bg-primary"></div><div class="text-gray-700">Benefit 2</div></div>
          <div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full bg-primary"></div><div class="text-gray-700">Benefit 3</div></div>
        </div>
      </div>
      <!-- Form Column -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div class="font-heading text-2xl font-bold mb-6">Get Your Free Guide</div>
        <div class="space-y-4">
          <div><div class="text-sm text-gray-600 mb-1">Name</div><div class="w-full h-12 border border-gray-200 rounded-lg bg-gray-50"></div></div>
          <div><div class="text-sm text-gray-600 mb-1">Email</div><div class="w-full h-12 border border-gray-200 rounded-lg bg-gray-50"></div></div>
          <div><div class="text-sm text-gray-600 mb-1">Phone</div><div class="w-full h-12 border border-gray-200 rounded-lg bg-gray-50"></div></div>
          <button class="w-full bg-primary text-white px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 hover:shadow-xl transition-all duration-200 mt-4">Submit</button>
        </div>
      </div>
    </div>
  </div>
</div>
\`\`\`

### full-bleed-overlay Hero
\`\`\`html
<div class="relative min-h-[80vh] flex items-center overflow-hidden">
  <div class="absolute inset-0">
    <img src="https://images.unsplash.com/photo-XXXXX?w=1920&h=1080&fit=crop" alt="Background" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
  </div>
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="max-w-xl">
      <div class="inline-block bg-white/20 text-white px-4 py-1.5 rounded-full font-semibold text-sm tracking-wide uppercase backdrop-blur-sm">LABEL</div>
      <div class="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mt-4">Headline Here</div>
      <div class="text-lg md:text-xl text-white/90 leading-relaxed mt-6">Subheadline text</div>
      <div class="mt-8">
        <a href="#cta" class="inline-flex items-center justify-center bg-primary text-white px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">Get Started</a>
      </div>
    </div>
  </div>
</div>
\`\`\`

## HOVER STATES - YOU WILL FORGET THIS

**EVERY interactive element MUST have hover states.** Add them to EVERYTHING:

- Buttons: \`hover:opacity-90 hover:shadow-xl hover:-translate-y-1 transition-all duration-200\`
- Cards: \`hover:shadow-2xl hover:-translate-y-2 transition-all duration-300\`
- Links: \`hover:text-primary transition-colors duration-200\`
- Images in containers: \`hover:scale-105 transition-transform duration-500\`

## Output Format

Return JSON with:
\`\`\`json
{
  "html": "<!DOCTYPE html>...",
  "sections": {
    "hero": "<div>...</div>",
    "features": "<div>...</div>"
  }
}
\`\`\`

## Critical Reminders - READ EVERY TIME

1. **HERO LAYOUT**: Implement the SPECIFIED hero layout pattern - do NOT default to two-column
2. **Element Whitelist**: Only div, img, a, button - NO EXCEPTIONS
3. **Mobile-First**: Start with base classes, add breakpoints progressively
4. **HOVER STATES**: Add hover:* classes to EVERY button, link, and card
5. **TYPOGRAPHY**: Use DRAMATIC size differences (text-5xl vs text-lg)
6. **BACKGROUNDS**: Alternate section backgrounds - never same color twice in a row
7. **STICKY HEADER**: Always include a sticky navigation header
8. **TRANSITIONS**: Add transition-all duration-200 to all interactive elements
`;

/**
 * Create prompt for the HTML Generator V2 agent.
 */
export function createHtmlGeneratorV2Prompt(
  contentStructure: ContentStructure & { heroLayout?: string },
  utilityClasses: UtilityClasses,
  brandKit: BrandKit,
  heroLayoutId: string
): string {
  // Derive background and text colors from neutral palette
  const bgColor = brandKit.colors.neutral?.[0] || "#FFFFFF";
  const textColor = brandKit.colors.neutral?.[9] || "#1A1A1A";
  const tagline = brandKit.businessInfo?.tagline || "Welcome";

  // Get hero layout instructions
  const heroLayoutInstructions = getHeroLayoutInstructions(heroLayoutId);

  return `
Generate a complete HTML landing page using ONLY div, img, a, button elements.

# HERO LAYOUT - CRITICAL
${heroLayoutInstructions}

# Brand Kit
- **Name:** ${brandKit.name}
- **Tagline:** ${tagline}
- **Heading Font:** ${brandKit.typography.headingFont}
- **Body Font:** ${brandKit.typography.bodyFont}
- **Primary Color:** ${brandKit.colors.primary}
- **Secondary Color:** ${brandKit.colors.secondary}
- **Accent Color:** ${brandKit.colors.accent}
- **Background Color:** ${bgColor}
- **Text Color:** ${textColor}
- **Personality:** ${brandKit.personalityTraits.join(", ")}

# Content Structure
\`\`\`json
${JSON.stringify(contentStructure, null, 2)}
\`\`\`

# Utility Classes
\`\`\`json
${JSON.stringify(utilityClasses, null, 2)}
\`\`\`

# Task
1. Create complete HTML document with:
   - <!DOCTYPE html>, <html lang="en">
   - <head> with:
     - Title: "${brandKit.name} - ${tagline}"
     - Tailwind CDN script
     - Tailwind config with brand colors (primary: '${brandKit.colors.primary}', secondary: '${brandKit.colors.secondary}', accent: '${brandKit.colors.accent}')
     - Google Fonts for ${brandKit.typography.headingFont} and ${brandKit.typography.bodyFont}
     - Custom CSS for .font-heading and .font-body classes
   - <body> with class="font-body bg-[${bgColor}] text-[${textColor}]"

2. **HERO SECTION - USE THE SPECIFIED LAYOUT: ${heroLayoutId}**
   - Implement the hero section using the "${heroLayoutId}" layout pattern
   - Follow the HTML structure reference provided above
   - Populate with content from the content structure

3. For remaining sections:
   - Build HTML using ONLY div, img, a, button
   - Apply the utility classes from Design System
   - Use brand colors throughout (primary: ${brandKit.colors.primary}, accent: ${brandKit.colors.accent})
   - Use REAL Unsplash URLs for images matching the business context
   - Implement mobile-first responsive patterns

4. Return complete styled HTML with proper fonts and colors

CRITICAL:
- The hero MUST use the "${heroLayoutId}" layout pattern - do NOT default to two-column text-left
- Only use div, img, a, button - any other element will be REJECTED
- Use REAL Unsplash URLs (https://images.unsplash.com/photo-XXXXX?w=800&h=600&fit=crop), NOT placeholders
- Include Google Fonts and custom font classes in head
- Apply background colors to body and sections
- Add hover states to ALL interactive elements

Return ONLY a valid JSON object with "html" and "sections" keys, no markdown code blocks.
`;
}

/**
 * Generate HTML via Claude Agent SDK with hero layout awareness.
 */
export async function generateHtmlV2(
  utilityClasses: UtilityClasses,
  contentStructure: ContentStructure & { heroLayout?: string },
  brandKit: BrandKit,
  heroLayoutId: string,
  model?: string
): Promise<HTMLGenerationResult> {
  const responseText = await sdkPrompt(
    createHtmlGeneratorV2Prompt(contentStructure, utilityClasses, brandKit, heroLayoutId),
    { systemPrompt: HTML_GENERATOR_V2_SYSTEM_PROMPT, model }
  );

  const htmlResult = extractJsonFromText(responseText);

  if (!htmlResult || !htmlResult.html) {
    // Log diagnostic info for debugging
    console.error("[HTMLGeneratorV2] Failed to extract valid HTML from response");
    console.error("[HTMLGeneratorV2] Response length:", responseText?.length || 0);
    console.error("[HTMLGeneratorV2] Response preview:", responseText?.substring(0, 500) || "(empty)");
    console.error("[HTMLGeneratorV2] Parsed result:", htmlResult);
    throw new Error(`HTMLGeneratorV2 failed to return valid HTML. Response length: ${responseText?.length || 0}, has html: ${!!htmlResult?.html}`);
  }

  return htmlResult as unknown as HTMLGenerationResult;
}
