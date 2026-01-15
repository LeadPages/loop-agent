/**
 * Landing Page Generator Module
 *
 * This module provides multi-agent orchestration for generating landing pages
 * from unstructured text input. It extracts brand information, creates design
 * systems, plans content, and generates HTML.
 */

// Schema exports
export type {
  BrandKit,
  BrandKitResult,
  ColorPalette,
  Typography,
  Spacing,
  ImageryStyle,
  BusinessInfo,
  DesignTokens,
  ContentStructure,
  SectionContent,
  UtilityClasses,
  HTMLGenerationResult,
  GenerationResult,
  GenerationState,
  IndustryTemplate,
  ColorPaletteOption,
  TypographyOption,
  ImageNeeded,
} from "./schemas";

// Orchestrator exports
export {
  LandingPageOrchestrator,
  generateLandingPage,
  type OrchestratorOptions,
  type OrchestratorProgress,
} from "./orchestrator";

// Brand kit generator exports
export { generateBrandKit } from "./brand-kit-generator";

// Prompt exports (for advanced usage)
export { DESIGN_PRINCIPLES, getDesignPrinciples } from "./prompts/design-principles";
export { COMPOSITION_PATTERNS, getCompositionPatterns } from "./prompts/composition-patterns";
export { RESPONSIVE_GUIDELINES, getResponsiveGuidelines } from "./prompts/responsive-guidelines";
export {
  INDUSTRY_TEMPLATES,
  getTemplateForIndustry,
  generateNeutralScale,
  getDefaultTypographyScale,
  getDefaultSpacingScale,
  getSemanticColors,
} from "./prompts/industry-templates";
export {
  BRAND_KIT_GENERATOR_SYSTEM_PROMPT,
  BRAND_KIT_EXTRACTION_PROMPT,
  IMAGE_ANALYSIS_PROMPT,
  getBrandKitSystemPrompt,
  getBrandKitExtractionPrompt,
  getImageAnalysisPromptAddition,
} from "./prompts/brand-kit-generation";

// SDK client exports
export type { ImageInput, ContentBlock, TextContent, ImageContent } from "./sdk-client";

// Agent exports (for advanced usage)
export {
  extractDesignTokens,
  createBrandAnalystPrompt,
  BRAND_ANALYST_SYSTEM_PROMPT,
} from "./agents/brand-analyst";
export {
  generateDesignSystem,
  generateDefaultUtilityClasses,
  createDesignSystemPrompt,
  DESIGN_SYSTEM_SYSTEM_PROMPT,
} from "./agents/design-system";
export {
  planContent,
  createContentPlannerPrompt,
  CONTENT_PLANNER_SYSTEM_PROMPT,
} from "./agents/content-planner";
export {
  generateHtml,
  createHtmlGeneratorPrompt,
  HTML_GENERATOR_SYSTEM_PROMPT,
} from "./agents/html-generator";
