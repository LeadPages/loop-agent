// Agent configuration registry

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  allowBash: boolean;
  restrictToWorkspace: boolean;
  additionalDirectories?: string[];
  icon: string;
  color: string;
  isBuiltin: boolean;
}

// Built-in agent configurations
export const BUILTIN_AGENTS: AgentConfig[] = [
  {
    id: "landing-page-generator",
    name: "Landing Page Generator",
    description: "Generates landing pages from text descriptions",
    systemPrompt: `You are a landing page generation assistant.

When the user provides text about a business or product:
1. First, extract brand information and create a brand kit
2. Generate a complete, responsive landing page using multi-agent orchestration
3. Write the HTML to generated.html in the workspace

You use a sophisticated multi-agent system:
- Brand Analyst: Extracts design tokens from brand information
- Design System: Creates Tailwind utility classes following anti-AI-slop principles
- Content Planner: Structures sections and content hierarchy
- HTML Generator: Builds HTML using only div, img, a, button elements

The generated HTML will:
- Be fully responsive (mobile-first)
- Use dramatic typography hierarchy
- Include proper hover states on all interactive elements
- Avoid generic AI patterns (centered everything, purple-blue gradients, etc.)
- Use only Tailwind CSS classes with the CDN

Always explain what you're generating and why.`,
    allowedTools: ["Read", "Write", "Edit", "Glob", "Grep"],
    allowBash: false,
    restrictToWorkspace: true,
    icon: "sparkles",
    color: "purple",
    isBuiltin: true,
  },
];

// Get agent by ID
export function getAgentConfig(id: string): AgentConfig | undefined {
  return BUILTIN_AGENTS.find((agent) => agent.id === id);
}

// List all agents
export function listAgentConfigs(): AgentConfig[] {
  return BUILTIN_AGENTS;
}

// Default agent ID
export const DEFAULT_AGENT_ID = "landing-page-generator";
