/**
 * Orchestrator - Multi-agent coordination for landing page generation.
 * Uses Claude Agent SDK for authentication (same as main agent).
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
import { planContent } from "./agents/content-planner";
import { generateHtml } from "./agents/html-generator";
import { validateAndReplaceImages } from "./image-validator";

export interface OrchestratorOptions {
  brandKit: BrandKit;
  requirements: string;
  model?: string;
  maxAttempts?: number;
}

export interface OrchestratorProgress {
  state: GenerationState;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * LandingPageOrchestrator - Coordinates multiple sub-agents to generate a landing page.
 */
export class LandingPageOrchestrator {
  private brandKit: BrandKit;
  private requirements: string;
  private model: string;
  private maxAttempts: number;

  // Generation state
  private state: GenerationState = "init";
  private designTokens: DesignTokens | null = null;
  private utilityClasses: UtilityClasses | null = null;
  private contentStructure: ContentStructure | null = null;
  private htmlDraft: string | null = null;
  private finalHtml: string | null = null;

  constructor(options: OrchestratorOptions) {
    this.brandKit = options.brandKit;
    this.requirements = options.requirements;
    this.model = options.model || "claude-sonnet-4-20250514";
    this.maxAttempts = options.maxAttempts || 3;
  }

  /**
   * Execute complete landing page generation workflow.
   * Yields progress updates for SSE streaming.
   */
  async *generate(): AsyncGenerator<OrchestratorProgress, string, unknown> {
    try {
      yield {
        state: "init",
        message: "Starting landing page generation...",
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
      yield {
        state: "generating_design_system",
        message: "Generating design system and planning content (parallel)...",
      };

      this.state = "generating_design_system";

      const [utilityClasses, contentStructure] = await Promise.all([
        this.runDesignSystem(),
        this.runContentPlanner(),
      ]);

      this.utilityClasses = utilityClasses;
      this.contentStructure = contentStructure;

      yield {
        state: "generating_design_system",
        message: `Generated ${Object.keys(this.utilityClasses).length} utility classes, planned ${this.contentStructure.sections.length} sections`,
        details: {
          utilityClassCount: Object.keys(this.utilityClasses).length,
          sectionCount: this.contentStructure.sections.length,
          sectionTypes: this.contentStructure.sections.map((s) => s.type),
        },
      };

      // Step 4: Generate HTML
      yield {
        state: "generating_html",
        message: "Generating HTML...",
      };

      this.state = "generating_html";
      const htmlResult = await this.runHtmlGenerator();
      this.htmlDraft = htmlResult.html;

      yield {
        state: "generating_html",
        message: `Generated ${this.htmlDraft.length} characters of HTML`,
        details: {
          htmlLength: this.htmlDraft.length,
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
        message: "Landing page generation complete!",
        details: {
          htmlLength: this.finalHtml.length,
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
   * Run content planning.
   */
  private async runContentPlanner(): Promise<ContentStructure> {
    if (!this.designTokens) {
      throw new Error("Design tokens not available");
    }

    // Build enriched requirements that include business context from brand kit
    const businessContext = this.buildBusinessContext();
    const enrichedRequirements = businessContext
      ? `## Business Context\n${businessContext}\n\n## User Requirements\n${this.requirements}`
      : this.requirements;

    return await planContent(this.designTokens, enrichedRequirements, this.model);
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
   * Run HTML generation.
   */
  private async runHtmlGenerator(): Promise<{
    html: string;
    imagesNeeded?: Array<{ id: string; alt: string; context: string }>;
  }> {
    if (!this.utilityClasses || !this.contentStructure) {
      throw new Error("Utility classes or content structure not available");
    }

    return await generateHtml(
      this.utilityClasses,
      this.contentStructure,
      this.brandKit,
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
}

/**
 * Generate a landing page from a brand kit and requirements.
 * This is a convenience function that wraps the orchestrator.
 */
export async function generateLandingPage(
  brandKit: BrandKit,
  requirements: string
): Promise<GenerationResult> {
  const orchestrator = new LandingPageOrchestrator({
    brandKit,
    requirements,
  });

  let html = "";
  let sections: string[] = [];

  for await (const progress of orchestrator.generate()) {
    if (progress.state === "complete" && progress.details?.sections) {
      sections = progress.details.sections as string[];
    }
  }

  html = orchestrator.getFinalHtml() || "";

  return {
    html,
    sections,
    tokensUsed: 0, // TODO: Track token usage
    cost: 0, // TODO: Calculate cost
  };
}
