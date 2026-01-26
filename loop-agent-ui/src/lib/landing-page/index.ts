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

// Orchestrator V2 exports (with hero layout diversity)
export {
  LandingPageOrchestratorV2,
  generateLandingPageV2,
  type OrchestratorV2Options,
  type OrchestratorV2Progress,
} from "./orchestrator-v2";

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

// V2 Agent exports (with hero layout diversity)
export {
  planContentV2,
  createContentPlannerV2Prompt,
  CONTENT_PLANNER_V2_SYSTEM_PROMPT,
} from "./agents/content-planner-v2";
export {
  generateHtmlV2,
  createHtmlGeneratorV2Prompt,
  HTML_GENERATOR_V2_SYSTEM_PROMPT,
} from "./agents/html-generator-v2";

// V3 CraftJSON exports
export {
  generateCraftJSON,
  generateCraftJSONFromPlan,
  createCraftJSONGeneratorPrompt,
  createCraftJSONGeneratorPromptFromPlan,
  CRAFT_JSON_GENERATOR_SYSTEM_PROMPT,
} from "./agents/craft-json-generator";

// V3 CraftJSON Planner exports
export {
  generatePagePlan,
  validatePagePlan,
  createPlannerPrompt,
  CRAFT_JSON_PLANNER_SYSTEM_PROMPT,
  type PagePlan,
  type PlannedSection,
  type PlannedElement,
  type SectionType,
  type HeroLayout as PlannerHeroLayout,
  type FeaturesLayout,
  type GenericLayout,
  type ElementPurpose,
} from "./agents/craft-json-planner";

// Orchestrator V3 exports (CraftJSON-based with planning)
export {
  LandingPageOrchestratorV3,
  generateLandingPageV3,
  type OrchestratorV3Options,
  type OrchestratorV3Progress,
  type OrchestratorV3Result,
  type OrchestratorV3State,
} from "./orchestrator-v3";

// CraftJSON module exports
export {
  // Types
  type RGBA,
  type CraftJSON,
  type CraftNode,
  type AgentPageInput,
  type AgentSection,
  type AgentElement,
  type CraftJSONGenerationResult,
  type RenderResult,
  // XML-Craft types
  type ConversionContext,
  type ValidationError,
  type TRBL,
  type GradientBackground,
  type ParsedClickEvent,
  type ParsedTextParagraph,
  type ParsedTextSpan,
  // Utilities
  expandToCraftJSON,
  validateAgentInput,
  // XML-Craft converters
  xmlToCraftJson,
  craftJsonToXml,
  validateXmlCraft,
  validateCraftJson,
  createConversionContext,
  // XML-Craft constants
  ELEMENT_TO_RESOLVED_NAME,
  RESOLVED_NAME_TO_ELEMENT,
  COMPONENT_DEFAULTS,
  // Render service
  renderCraftJSON,
  renderCraftJSONWithRetry,
  checkRenderServiceHealth,
} from "./craft-json";

// Hero layout patterns exports
export {
  HERO_LAYOUTS,
  LAYOUT_SELECTION_GUIDE,
  HERO_LAYOUT_PATTERNS_PROMPT,
  getHeroLayout,
  selectHeroLayout,
  type HeroLayout,
} from "./prompts/hero-layout-patterns";
