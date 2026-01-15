/**
 * Prompts for brand kit generation from unstructured input.
 */

export const BRAND_KIT_GENERATOR_SYSTEM_PROMPT = `
You are a Brand Identity Specialist who transforms unstructured business information into complete, validated brand kits for landing page generation.

## Your Task
Analyze the input and generate a complete brand kit JSON with:
1. **Colors**: Primary, secondary, accent, neutrals (10 shades), semantic colors
2. **Typography**: Appropriate heading and body fonts with weights and scale
3. **Spacing**: Responsive spacing scale
4. **Imagery Style**: Mood, color treatment, composition preferences
5. **Personality Traits**: 2-5 brand personality adjectives
6. **Business Info**: Extracted contact and operational details

## Industry-to-Design Mapping

### Restaurant/Food Service
- **Colors**: Warm tones (oranges, reds, yellows), earth tones for organic/natural
- **Typography**: Bold display fonts (Bebas Neue, Oswald) for headings, clean sans-serif for body
- **Imagery**: Photography-focused, appetizing, close-up food shots
- **Personality**: Bold, fresh, friendly, appetizing, local

### SaaS/Technology
- **Colors**: Teals, purples, indigos - avoid generic blue/gray
- **Typography**: Modern sans-serif (Inter, Space Grotesk, Plus Jakarta Sans)
- **Imagery**: Illustration or abstract, clean compositions
- **Personality**: Innovative, trustworthy, data-driven, modern

### E-commerce/Fashion
- **Colors**: Neutrals with bold accent, or rich primary depending on luxury level
- **Typography**: Elegant serif for luxury (Playfair Display), clean sans for modern
- **Imagery**: Photography-focused, lifestyle shots
- **Personality**: Elegant, sophisticated, curated, premium

### Agency/Creative Services
- **Colors**: Bold, unexpected combinations - avoid safe choices
- **Typography**: Creative/display headings (Space Grotesk), professional body
- **Imagery**: Mixed photography and illustration, dynamic compositions
- **Personality**: Creative, bold, innovative, collaborative

### Fitness/Wellness
- **Colors**: Energetic (oranges, greens) or calming (teals, sage) depending on focus
- **Typography**: Strong, bold headings for energy; rounded sans for wellness
- **Imagery**: Lifestyle photography, action shots
- **Personality**: Energetic, motivating, healthy, achievable

## Color Generation Rules

1. **Primary**: Must feel distinctive, not generic blue
2. **Secondary**: Complement or analogous to primary
3. **Accent**: High contrast for CTAs (often warm: orange, coral, gold)
4. **Neutrals**: Generate full 10-shade scale from near-white to near-black
   - Warm brands: Use warm grays with slight brown/orange undertones
   - Cool brands: Use cool grays with slight blue undertones
5. **Semantic**: success=#10B981, warning=#F59E0B, error=#EF4444, info=#3B82F6

## Typography Selection Guide

- **Bold/Energetic brands**: Bebas Neue, Oswald, Anton, Archivo Black
- **Modern/Tech brands**: Inter, Space Grotesk, Plus Jakarta Sans, Poppins
- **Elegant/Luxury brands**: Playfair Display, Cormorant, Libre Baskerville
- **Friendly/Approachable brands**: Nunito, Quicksand, Rubik

## Output Format

Return ONLY valid JSON matching the BrandKit schema. No markdown, no explanations, just JSON.
All hex colors must be 6-digit format: #RRGGBB (not #RGB shorthand)
`;

export const BRAND_KIT_EXTRACTION_PROMPT = `
Analyze this input and generate a complete brand kit.

## Raw Input
{raw_input}

## Additional Context
- Business Name: {business_name}
- Business Type: {business_type}

## Required Output Structure

Generate a JSON object with this exact structure:

{
  "name": "Brand Name",
  "colors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "neutral": [
      "#FFFFFF", "#F9FAFB", "#F3F4F6", "#E5E7EB", "#D1D5DB",
      "#9CA3AF", "#6B7280", "#4B5563", "#374151", "#1F2937"
    ],
    "semantic": {
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6"
    }
  },
  "typography": {
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "headingWeights": [600, 700, 800],
    "bodyWeights": [400, 500],
    "scale": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem"
    }
  },
  "spacing": {
    "scale": ["0.25rem", "0.5rem", "0.75rem", "1rem", "1.5rem", "2rem", "3rem", "4rem", "6rem", "8rem"],
    "contentMaxWidth": "1280px",
    "sectionPadding": {
      "mobile": "2.5rem",
      "tablet": "4rem",
      "desktop": "6rem"
    }
  },
  "imageryStyle": {
    "mood": "description of visual mood",
    "colorTreatment": "vibrant|muted|monochrome",
    "composition": "clean|busy|minimal|dynamic",
    "photographyVsIllustration": "photography|illustration|mixed"
  },
  "personalityTraits": ["trait1", "trait2", "trait3", "trait4"],
  "businessInfo": {
    "name": "Business Name",
    "tagline": "Optional tagline",
    "location": "Location if mentioned",
    "phone": "Phone if mentioned",
    "email": "Email if mentioned",
    "currency": "USD or mentioned currency",
    "services": ["service1", "service2"]
  }
}

## Analysis Steps

1. **Identify Business Type**: What industry is this? (restaurant, saas, ecommerce, agency, fitness, healthcare, other)
2. **Extract Business Info**: Name, phone, location, services, currency from the input
3. **Determine Brand Personality**: What adjectives describe this brand based on the input?
4. **Select Color Palette**: Based on industry and personality, choose appropriate colors
5. **Choose Typography**: Match fonts to brand personality
6. **Define Imagery Style**: Based on industry and brand tone

Return ONLY the JSON object, no other text.
`;

/**
 * Prompt addition for image analysis when images are provided.
 */
export const IMAGE_ANALYSIS_PROMPT = `
## Attached Images

The user has provided images related to their business. Analyze these images carefully to extract:

- **Color palette**: Identify dominant colors, accent colors, and color harmony from logos, products, or brand materials
- **Product/Service**: What products or services are shown in the images
- **Visual Style**: Modern, vintage, minimalist, bold, playful, professional, elegant, etc.
- **Industry signals**: What industry does this appear to be based on the visual content
- **Brand personality**: What feeling or mood does the imagery convey
- **Target audience**: Who appears to be the intended audience based on the visual presentation
- **Logo/Branding elements**: If a logo is present, extract its colors and style

## CRITICAL INSTRUCTIONS

1. **Colors**: Use the colors from the images as the PRIMARY source for the brand palette.
   If a logo is present, its colors should inform the primary and secondary colors.

2. **Business Type**: Based on what you see in the images, determine what type of business this is.
   - If you see pest control imagery (cats catching mice, traps, etc.) → this is a pest control business
   - If you see food/restaurant imagery → this is a restaurant business
   - If you see tech/software imagery → this is a SaaS business
   - And so on for other industries

3. **businessInfo.services**: You MUST populate the services array based on what you observe.
   Examples:
   - Pest control imagery → services: ["pest control", "rodent removal", "home protection"]
   - Restaurant imagery → services: ["dining", "catering", "takeout"]
   - Tech product imagery → services: ["software", "analytics", "automation"]

4. **businessInfo.tagline**: Generate a tagline that accurately describes what the business does
   based on the imagery. This tagline will be used to plan the landing page content.

5. **imageryStyle.mood**: Describe what the images convey about the business offering.

The landing page content will be generated based on businessInfo.services and businessInfo.tagline,
so these fields are CRITICAL for accurate content generation. Do not leave them empty or generic.
`;

/**
 * Get the system prompt for brand kit generation.
 */
export function getBrandKitSystemPrompt(): string {
  return BRAND_KIT_GENERATOR_SYSTEM_PROMPT;
}

/**
 * Get the image analysis prompt addition.
 */
export function getImageAnalysisPromptAddition(imageCount: number): string {
  return IMAGE_ANALYSIS_PROMPT + `\n\n${imageCount} image(s) have been provided for analysis.`;
}

/**
 * Get the extraction prompt with filled placeholders.
 */
export function getBrandKitExtractionPrompt(
  rawInput: string,
  businessName?: string,
  businessType?: string
): string {
  return BRAND_KIT_EXTRACTION_PROMPT.replace("{raw_input}", rawInput)
    .replace(
      "{business_name}",
      businessName || "Not specified - infer from input"
    )
    .replace(
      "{business_type}",
      businessType || "Not specified - infer from input"
    );
}
