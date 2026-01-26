/**
 * Orchestrator V3 - CraftJSON-based landing page generation with planning.
 *
 * This orchestrator uses a two-phase approach:
 * 1. Plan the page structure (sections, layouts, elements)
 * 2. Generate CraftJSON following the plan
 *
 * Flow:
 * 1. Analyze brand kit → Design tokens
 * 2. Generate design system (parallel with planning)
 * 3. Plan page structure → PagePlan
 * 4. Generate CraftJSON from plan → Expand to full CraftJSON
 * 5. Render CraftJSON to HTML via API
 */

import type {
  BrandKit,
  DesignTokens,
  UtilityClasses,
  ContentStructure,
  GenerationState,
} from "./schemas";
import type { CraftJSON, AgentPageInput, CraftJSONGenerationResult } from "./craft-json/types";
import type { PagePlan } from "./agents/craft-json-planner";
import { extractDesignTokens } from "./agents/brand-analyst";
import {
  generateDesignSystem,
  generateDefaultUtilityClasses,
} from "./agents/design-system";
import { planContentV2 } from "./agents/content-planner-v2";
import { generatePagePlan } from "./agents/craft-json-planner";
import { generateCraftJSONFromPlan } from "./agents/craft-json-generator";
import { getHeroLayout } from "./prompts/hero-layout-patterns";

export type OrchestratorV3State =
  | GenerationState
  | "planning_structure"
  | "generating_craft_json"
  | "rendering";

export interface OrchestratorV3Options {
  brandKit: BrandKit;
  requirements: string;
  model?: string;
  maxAttempts?: number;
  previousHeroLayouts?: string[];
}

export interface OrchestratorV3Progress {
  state: OrchestratorV3State;
  message: string;
  details?: Record<string, unknown>;
}

export interface OrchestratorV3Result {
  html: string;
  craftJSON: CraftJSON;
  agentInput: AgentPageInput;
  sections: string[];
  heroLayout: string;
  pagePlan: PagePlan;
  tokensUsed: number;
  cost: number;
}

/**
 * LandingPageOrchestratorV3 - CraftJSON-based orchestrator with planning
 */
export class LandingPageOrchestratorV3 {
  private brandKit: BrandKit;
  private requirements: string;
  private model: string;
  private maxAttempts: number;
  private previousHeroLayouts: string[];

  // Generation state
  private state: OrchestratorV3State = "init";
  private designTokens: DesignTokens | null = null;
  private utilityClasses: UtilityClasses | null = null;
  private contentStructure: (ContentStructure & { heroLayout: string }) | null = null;
  private pagePlan: PagePlan | null = null;
  private selectedHeroLayout: string | null = null;
  private craftJSONResult: CraftJSONGenerationResult | null = null;

  constructor(options: OrchestratorV3Options) {
    this.brandKit = options.brandKit;
    this.requirements = options.requirements;
    this.model = options.model || "claude-sonnet-4-5-20250929";
    this.maxAttempts = options.maxAttempts || 3;
    this.previousHeroLayouts = options.previousHeroLayouts || [];
  }

  /**
   * Execute complete landing page generation workflow with CraftJSON.
   * Yields progress updates for SSE streaming.
   */
  async *generate(): AsyncGenerator<OrchestratorV3Progress, OrchestratorV3Result, unknown> {
    try {
      yield {
        state: "init",
        message: "Starting landing page generation (V3 with CraftJSON)...",
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

      // Step 2: Generate design system and plan content structure (parallel)
      yield {
        state: "generating_design_system",
        message: "Generating design system and analyzing content requirements...",
      };

      this.state = "generating_design_system";

      const [utilityClasses, contentStructure] = await Promise.all([
        this.runDesignSystem(),
        this.runContentPlanner(),
      ]);

      this.utilityClasses = utilityClasses;
      this.contentStructure = contentStructure;
      this.selectedHeroLayout = contentStructure.heroLayout;

      yield {
        state: "generating_design_system",
        message: `Design system ready, identified ${this.contentStructure.sections.length} content sections`,
        details: {
          utilityClassCount: Object.keys(this.utilityClasses).length,
          sectionCount: this.contentStructure.sections.length,
          sectionTypes: this.contentStructure.sections.map((s) => s.type),
        },
      };

      // Step 3: Plan the page structure (NEW - the planner agent)
      yield {
        state: "planning_structure",
        message: "Planning page structure and layout...",
      };

      this.state = "planning_structure";
      this.pagePlan = await this.runPagePlanner();

      const heroSection = this.pagePlan.sections.find(s => s.type === "hero");
      const heroLayoutFromPlan = heroSection?.layout || this.selectedHeroLayout;

      yield {
        state: "planning_structure",
        message: `Planned ${this.pagePlan.sections.length} sections with "${heroLayoutFromPlan}" hero layout`,
        details: {
          sectionCount: this.pagePlan.sections.length,
          sectionTypes: this.pagePlan.sections.map(s => s.type),
          heroLayout: heroLayoutFromPlan,
          colorStrategy: this.pagePlan.colorStrategy,
        },
      };

      // Step 4: Generate CraftJSON from the plan
      const layoutDetails = getHeroLayout(heroLayoutFromPlan || "");

      yield {
        state: "generating_craft_json",
        message: `Generating CraftJSON following the page plan...`,
      };

      this.state = "generating_craft_json";
      this.craftJSONResult = await this.runCraftJSONGenerator();

      yield {
        state: "generating_craft_json",
        message: `Generated CraftJSON with ${Object.keys(this.craftJSONResult.craftJSON).length - 1} nodes`,
        details: {
          nodeCount: Object.keys(this.craftJSONResult.craftJSON).length - 1, // -1 for version
          sectionCount: this.craftJSONResult.agentInput.sections.length,
        },
      };

      // Step 5: CraftJSON is already rendered in the generator
      yield {
        state: "rendering",
        message: "Rendering CraftJSON to HTML...",
      };

      this.state = "rendering";

      if (!this.craftJSONResult.html) {
        yield {
          state: "error",
          message: "Failed to render CraftJSON to HTML",
        };
        throw new Error("Render failed - no HTML returned");
      }

      yield {
        state: "rendering",
        message: `Rendered ${this.craftJSONResult.html.length} characters of HTML`,
        details: {
          htmlLength: this.craftJSONResult.html.length,
        },
      };

      this.state = "complete";
      yield {
        state: "complete",
        message: `Landing page generation complete! ${this.pagePlan.sections.length} sections created.`,
        details: {
          htmlLength: this.craftJSONResult.html.length,
          heroLayout: heroLayoutFromPlan,
          heroLayoutName: layoutDetails?.name,
          sections: this.pagePlan.sections.map((s) => s.type),
          craftJSONNodeCount: Object.keys(this.craftJSONResult.craftJSON).length - 1,
        },
      };

      return {
        html: this.craftJSONResult.html,
        craftJSON: this.craftJSONResult.craftJSON,
        agentInput: this.craftJSONResult.agentInput,
        sections: this.craftJSONResult.sections,
        heroLayout: heroLayoutFromPlan || "",
        pagePlan: this.pagePlan,
        tokensUsed: 0, // TODO: Track token usage
        cost: 0, // TODO: Calculate cost
      };
    } catch (error) {
      this.state = "error";
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
      return generateDefaultUtilityClasses(this.designTokens);
    }
  }

  /**
   * Run content planning with V2 (hero layout awareness).
   */
  private async runContentPlanner(): Promise<ContentStructure & { heroLayout: string }> {
    if (!this.designTokens) {
      throw new Error("Design tokens not available");
    }

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
   * Run the page structure planner.
   */
  private async runPagePlanner(): Promise<PagePlan> {
    return await generatePagePlan(
      this.brandKit,
      this.requirements,
      this.contentStructure || undefined,
      this.model
    );
  }

  /**
   * Build business context string from brand kit for content planner.
   */
  private buildBusinessContext(): string {
    const parts: string[] = [];
    const { businessInfo, name, imageryStyle } = this.brandKit;

    if (name) {
      parts.push(`**Business Name:** ${name}`);
    }

    if (businessInfo?.tagline) {
      parts.push(`**Tagline:** ${businessInfo.tagline}`);
    }

    if (businessInfo?.services && businessInfo.services.length > 0) {
      parts.push(`**Services/Products:** ${businessInfo.services.join(", ")}`);
    }

    if (imageryStyle?.mood) {
      parts.push(`**Visual Mood:** ${imageryStyle.mood}`);
    }

    return parts.join("\n");
  }

  /**
   * Run CraftJSON generation using the page plan.
   */
  private async runCraftJSONGenerator(): Promise<CraftJSONGenerationResult> {
    if (!this.pagePlan) {
      throw new Error("Page plan not available");
    }

    return await generateCraftJSONFromPlan(
      this.pagePlan,
      this.brandKit,
      this.model
    );
  }

  /**
   * Get current state.
   */
  getState(): OrchestratorV3State {
    return this.state;
  }

  /**
   * Get final result.
   */
  getResult(): CraftJSONGenerationResult | null {
    return this.craftJSONResult;
  }

  /**
   * Get selected hero layout.
   */
  getSelectedHeroLayout(): string | null {
    return this.selectedHeroLayout;
  }

  /**
   * Get the page plan.
   */
  getPagePlan(): PagePlan | null {
    return this.pagePlan;
  }
}

/**
 * Generate a landing page from a brand kit and requirements using V3 orchestrator.
 * This is a convenience function that wraps the orchestrator.
 */
export async function generateLandingPageV3(
  brandKit: BrandKit,
  requirements: string,
  previousHeroLayouts: string[] = []
): Promise<OrchestratorV3Result> {
  const orchestrator = new LandingPageOrchestratorV3({
    brandKit,
    requirements,
    previousHeroLayouts,
  });

  let result: OrchestratorV3Result | null = null;

  for await (const progress of orchestrator.generate()) {
    if (progress.state === "complete") {
      // The generate() returns the result
    }
  }

  const craftResult = orchestrator.getResult();
  const pagePlan = orchestrator.getPagePlan();

  result = craftResult && pagePlan
    ? {
        html: craftResult.html,
        craftJSON: craftResult.craftJSON,
        agentInput: craftResult.agentInput,
        sections: craftResult.sections,
        heroLayout: orchestrator.getSelectedHeroLayout() || "",
        pagePlan: pagePlan,
        tokensUsed: 0,
        cost: 0,
      }
    : null;

  if (!result) {
    throw new Error("Generation failed - no result returned");
  }

  return result;
}
