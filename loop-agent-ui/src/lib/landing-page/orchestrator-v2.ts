/**
 * Orchestrator V2 - Multi-agent coordination with hero layout diversity.
 * Enhanced version that uses intelligent hero layout selection.
 */

import type {
  BrandKit,
  DesignTokens,
  UtilityClasses,
  ContentStructure,
  GenerationResult,
  GenerationState,
} from "./schemas";
import { extractDesignTokens } from "./agents/brand-analyst";
import {
  generateDesignSystem,
  generateDefaultUtilityClasses,
} from "./agents/design-system";
import { planContentV2 } from "./agents/content-planner-v2";
import { generateHtmlV2 } from "./agents/html-generator-v2";
import { validateAndReplaceImages } from "./image-validator";
import { getHeroLayout } from "./prompts/hero-layout-patterns";

export interface OrchestratorV2Options {
  brandKit: BrandKit;
  requirements: string;
  model?: string;
  maxAttempts?: number;
  previousHeroLayouts?: string[]; // Track previously used layouts for variety
}

export interface OrchestratorV2Progress {
  state: GenerationState;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * LandingPageOrchestratorV2 - Enhanced orchestrator with hero layout diversity.
 */
export class LandingPageOrchestratorV2 {
  private brandKit: BrandKit;
  private requirements: string;
  private model: string;
  private maxAttempts: number;
  private previousHeroLayouts: string[];

  // Generation state
  private state: GenerationState = "init";
  private designTokens: DesignTokens | null = null;
  private utilityClasses: UtilityClasses | null = null;
  private contentStructure: (ContentStructure & { heroLayout: string }) | null = null;
  private htmlDraft: string | null = null;
  private finalHtml: string | null = null;
  private selectedHeroLayout: string | null = null;

  constructor(options: OrchestratorV2Options) {
    this.brandKit = options.brandKit;
    this.requirements = options.requirements;
    this.model = options.model || "claude-sonnet-4-5-20250929";
    this.maxAttempts = options.maxAttempts || 3;
    this.previousHeroLayouts = options.previousHeroLayouts || [];
  }

  /**
   * Execute complete landing page generation workflow with hero layout awareness.
   * Yields progress updates for SSE streaming.
   */
  async *generate(): AsyncGenerator<OrchestratorV2Progress, string, unknown> {
    try {
      yield {
        state: "init",
        message: "Starting landing page generation (V2 with hero layout diversity)...",
      };

      // Step 1: Analyze brand kit
      yield {
        state: "analyzing_brand",
        message: "Analyzing brand kit and extracting design tokens...",
      };

      this.state = "analyzing_brand";
      this.designTokens = extractDesignTokens(this.brandKit);

      yield {
        state: "analyzing_brand",
        message: `Extracted ${Object.keys(this.designTokens.colorPalette).length} colors`,
        details: {
          colors: Object.keys(this.designTokens.colorPalette).length,
          personality: this.designTokens.brandPersonality,
        },
      };

      // Step 2 & 3: Generate design system and plan content (parallel)
      // V2: Content planner now includes hero layout selection
      yield {
        state: "generating_design_system",
        message: "Generating design system and planning content with hero layout selection (parallel)...",
      };

      this.state = "generating_design_system";

      const [utilityClasses, contentStructure] = await Promise.all([
        this.runDesignSystem(),
        this.runContentPlannerV2(),
      ]);

      this.utilityClasses = utilityClasses;
      this.contentStructure = contentStructure;
      this.selectedHeroLayout = contentStructure.heroLayout;

      // Get layout details for logging
      const layoutDetails = getHeroLayout(this.selectedHeroLayout);

      yield {
        state: "generating_design_system",
        message: `Selected hero layout: "${layoutDetails?.name || this.selectedHeroLayout}", planned ${this.contentStructure.sections.length} sections`,
        details: {
          heroLayout: this.selectedHeroLayout,
          heroLayoutName: layoutDetails?.name,
          utilityClassCount: Object.keys(this.utilityClasses).length,
          sectionCount: this.contentStructure.sections.length,
          sectionTypes: this.contentStructure.sections.map((s) => s.type),
        },
      };

      // Step 4: Generate HTML with hero layout awareness
      yield {
        state: "generating_html",
        message: `Generating HTML with ${layoutDetails?.name || this.selectedHeroLayout} hero layout...`,
      };

      this.state = "generating_html";
      const htmlResult = await this.runHtmlGeneratorV2();
      this.htmlDraft = htmlResult.html;

      yield {
        state: "generating_html",
        message: `Generated ${this.htmlDraft.length} characters of HTML`,
        details: {
          htmlLength: this.htmlDraft.length,
          heroLayout: this.selectedHeroLayout,
        },
      };

      // Validate images and replace broken Unsplash URLs with fallbacks
      yield {
        state: "generating_html",
        message: "Validating images...",
      };

      this.finalHtml = await validateAndReplaceImages(this.htmlDraft);

      this.state = "complete";
      yield {
        state: "complete",
        message: `Landing page generation complete! Used "${layoutDetails?.name || this.selectedHeroLayout}" hero layout.`,
        details: {
          htmlLength: this.finalHtml.length,
          heroLayout: this.selectedHeroLayout,
          heroLayoutName: layoutDetails?.name,
          sections: this.contentStructure.sections.map((s) => s.type),
        },
      };

      return this.finalHtml;
    } catch (error) {
      this.state = "error";
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      yield {
        state: "error",
        message: `Generation failed: ${errorMessage}`,
      };

      throw new Error(`Landing page generation failed: ${errorMessage}`);
    }
  }

  /**
   * Run design system generation.
   */
  private async runDesignSystem(): Promise<UtilityClasses> {
    if (!this.designTokens) {
      throw new Error("Design tokens not available");
    }

    try {
      return await generateDesignSystem(this.designTokens, this.model);
    } catch {
      // Fallback to default utility classes
      return generateDefaultUtilityClasses(this.designTokens);
    }
  }

  /**
   * Run content planning with V2 (hero layout awareness).
   */
  private async runContentPlannerV2(): Promise<ContentStructure & { heroLayout: string }> {
    if (!this.designTokens) {
      throw new Error("Design tokens not available");
    }

    // Build enriched requirements that include business context from brand kit
    const businessContext = this.buildBusinessContext();
    const enrichedRequirements = businessContext
      ? `## Business Context\n${businessContext}\n\n## User Requirements\n${this.requirements}`
      : this.requirements;

    return await planContentV2(
      this.designTokens,
      enrichedRequirements,
      this.model,
      this.previousHeroLayouts
    );
  }

  /**
   * Build business context string from brand kit for content planner.
   */
  private buildBusinessContext(): string {
    const parts: string[] = [];
    const { businessInfo, name, imageryStyle } = this.brandKit;

    // Business name
    if (name) {
      parts.push(`**Business Name:** ${name}`);
    }

    // Tagline (often describes what the business does)
    if (businessInfo?.tagline) {
      parts.push(`**Tagline:** ${businessInfo.tagline}`);
    }

    // Services (critical for understanding business type)
    if (businessInfo?.services && businessInfo.services.length > 0) {
      parts.push(`**Services/Products:** ${businessInfo.services.join(", ")}`);
    }

    // Imagery mood (provides context about brand direction)
    if (imageryStyle?.mood) {
      parts.push(`**Visual Mood:** ${imageryStyle.mood}`);
    }

    return parts.join("\n");
  }

  /**
   * Run HTML generation with V2 (hero layout awareness).
   */
  private async runHtmlGeneratorV2(): Promise<{
    html: string;
    imagesNeeded?: Array<{ id: string; alt: string; context: string }>;
  }> {
    if (!this.utilityClasses || !this.contentStructure) {
      throw new Error("Utility classes or content structure not available");
    }

    return await generateHtmlV2(
      this.utilityClasses,
      this.contentStructure,
      this.brandKit,
      this.selectedHeroLayout || "two-col-text-left",
      this.model
    );
  }

  /**
   * Get current state.
   */
  getState(): GenerationState {
    return this.state;
  }

  /**
   * Get final HTML.
   */
  getFinalHtml(): string | null {
    return this.finalHtml;
  }

  /**
   * Get selected hero layout.
   */
  getSelectedHeroLayout(): string | null {
    return this.selectedHeroLayout;
  }
}

/**
 * Generate a landing page from a brand kit and requirements using V2 orchestrator.
 * This is a convenience function that wraps the orchestrator.
 */
export async function generateLandingPageV2(
  brandKit: BrandKit,
  requirements: string,
  previousHeroLayouts: string[] = []
): Promise<GenerationResult & { heroLayout: string }> {
  const orchestrator = new LandingPageOrchestratorV2({
    brandKit,
    requirements,
    previousHeroLayouts,
  });

  let html = "";
  let sections: string[] = [];
  let heroLayout = "";

  for await (const progress of orchestrator.generate()) {
    if (progress.state === "complete" && progress.details?.sections) {
      sections = progress.details.sections as string[];
      heroLayout = (progress.details.heroLayout as string) || "";
    }
  }

  html = orchestrator.getFinalHtml() || "";

  return {
    html,
    sections,
    heroLayout,
    tokensUsed: 0, // TODO: Track token usage
    cost: 0, // TODO: Calculate cost
  };
}
