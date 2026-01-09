# Phase 4: Landing Page Generator Agent (TypeScript Port)

## Current State

- Python implementation at `~/repos/leadpages/loop-agent-sdk`
- Multi-agent orchestration with 5 sub-agents
- FastAPI endpoints for brand kit generation and page generation
- 400+ token design principles to avoid "AI slop"
- Works well but requires separate Python service

## Goal

Port the landing page generator to TypeScript and integrate it as a new agent in the loop-agent-ui dashboard. Users can paste unstructured text, the system extracts a brand kit, and generates a complete landing page HTML.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  loop-agent-ui                                                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Agent Selector                                                     ││
│  │  [Loop Agent] [Loop Agent (Safe)] [Landing Page Generator]          ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Landing Page Generator Flow                                        ││
│  │                                                                     ││
│  │  User pastes text                                                   ││
│  │       ↓                                                             ││
│  │  Brand Kit Extraction (Claude API)                                  ││
│  │       ↓                                                             ││
│  │  ┌──────────────────┬──────────────────┐                           ││
│  │  │ Design System    │ Content Planner  │  (parallel)               ││
│  │  └────────┬─────────┴────────┬─────────┘                           ││
│  │           └────────┬─────────┘                                      ││
│  │                    ↓                                                ││
│  │           HTML Generator                                            ││
│  │                    ↓                                                ││
│  │           Write to workspace/generated.html                         ││
│  │                    ↓                                                ││
│  │           Return preview URL or HTML content                        ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### BrandKit Schema (TypeScript)

```typescript
// src/lib/landing-page/schemas.ts

interface ColorPalette {
  primary: string;      // #hex
  secondary: string;    // #hex
  accent: string;       // #hex for CTAs
  neutral: string[];    // 3-10 grayscale shades
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

interface Typography {
  headingFont: string;
  bodyFont: string;
  headingWeights: number[];
  bodyWeights: number[];
  scale: Record<string, string>; // xs, sm, base, lg, xl, 2xl...6xl
}

interface Spacing {
  scale: string[];           // ["0.25rem", "0.5rem", ..., "8rem"]
  contentMaxWidth: string;   // "1280px"
  sectionPadding: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

interface ImageryStyle {
  mood: string;                        // "modern and professional"
  colorTreatment: string;              // vibrant|muted|monochrome
  composition: string;                 // clean|busy|minimal|dynamic
  photographyVsIllustration: string;   // photography|illustration|mixed
}

interface BusinessInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  services?: string[];
}

interface BrandKit {
  name: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  imageryStyle: ImageryStyle;
  personalityTraits: string[];  // 2-5 adjectives
  logoUrl?: string;
  businessInfo?: BusinessInfo;
}
```

### Design Tokens (Compressed for prompts)

```typescript
interface DesignTokens {
  colors: Record<string, string>;  // Flattened: primary, secondary, neutral_0...9
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: Record<string, string>;
  };
  spacing: {
    sectionPadding: string;
    contentMaxWidth: string;
  };
  imagery: ImageryStyle;
  personality: string[];
}
```

---

## Implementation Steps

### 1. Create Landing Page Module Structure

```
src/lib/landing-page/
├── schemas.ts           # TypeScript interfaces
├── prompts/
│   ├── design-principles.ts    # 400+ token anti-AI-slop guide
│   ├── composition-patterns.ts # 7 section patterns
│   ├── responsive-guidelines.ts
│   └── industry-templates.ts   # Restaurant, SaaS, etc.
├── agents/
│   ├── brand-analyst.ts
│   ├── design-system.ts
│   ├── content-planner.ts
│   └── html-generator.ts
├── orchestrator.ts      # Multi-agent coordination
├── brand-kit-generator.ts
└── index.ts             # Public exports
```

### 2. Port Design Principles & Prompts

From Python files:
- `/src/prompts/design_principles.py` → `prompts/design-principles.ts`
- `/src/prompts/composition_patterns.py` → `prompts/composition-patterns.ts`
- `/src/prompts/responsive_guidelines.py` → `prompts/responsive-guidelines.ts`
- `/src/data/industry_templates.py` → `prompts/industry-templates.ts`

Key content to port:
```typescript
// design-principles.ts
export const DESIGN_PRINCIPLES = `
## Typography
- Dramatic size differences: text-6xl vs text-base, NOT text-2xl vs text-xl
- Heading hierarchy must be visually obvious

## Colors
- Avoid generic blue/purple gradients
- Use brand's distinctive palette consistently
- Accent color ONLY for primary CTAs

## Layout
- Asymmetry over perfect centering
- Vary section rhythms
- Generous whitespace (py-16, py-24)

## Interactive Elements
- ALWAYS include hover states
- Transitions on all clickable elements
- Minimum 44x44px touch targets

## Anti-Patterns (NEVER DO)
❌ Everything centered
❌ Equal spacing between all sections
❌ Three identical feature cards
❌ Same border-radius everywhere
❌ Missing hover states
❌ Subtle type scale differences
`;
```

### 3. Port Sub-Agent Prompts

Each sub-agent becomes a function that calls Claude API with specific system prompt:

```typescript
// agents/design-system.ts
import Anthropic from "@anthropic-ai/sdk";
import { DESIGN_PRINCIPLES } from "../prompts/design-principles";
import { RESPONSIVE_GUIDELINES } from "../prompts/responsive-guidelines";

const DESIGN_SYSTEM_PROMPT = `You are a Tailwind CSS expert...`;

export async function generateDesignSystem(
  client: Anthropic,
  designTokens: DesignTokens
): Promise<Record<string, string>> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: DESIGN_SYSTEM_PROMPT + DESIGN_PRINCIPLES + RESPONSIVE_GUIDELINES,
    messages: [{
      role: "user",
      content: `Generate Tailwind utility classes for: ${JSON.stringify(designTokens)}`
    }]
  });

  // Parse and return utility classes
  return parseUtilityClasses(response);
}
```

### 4. Create Orchestrator

Port `coordinator_v2.py` logic:

```typescript
// orchestrator.ts
import Anthropic from "@anthropic-ai/sdk";
import { BrandKit, DesignTokens } from "./schemas";
import { extractDesignTokens } from "./agents/brand-analyst";
import { generateDesignSystem } from "./agents/design-system";
import { planContent } from "./agents/content-planner";
import { generateHtml } from "./agents/html-generator";

export interface GenerationResult {
  html: string;
  sections: string[];
  tokensUsed: number;
  cost: number;
}

export async function generateLandingPage(
  brandKit: BrandKit,
  requirements: string
): Promise<GenerationResult> {
  const client = new Anthropic();

  // Step 1: Extract design tokens
  const designTokens = extractDesignTokens(brandKit);

  // Step 2: Run design system and content planner in parallel
  const [utilityClasses, contentStructure] = await Promise.all([
    generateDesignSystem(client, designTokens),
    planContent(client, designTokens, requirements)
  ]);

  // Step 3: Generate HTML
  const html = await generateHtml(client, utilityClasses, contentStructure);

  return {
    html,
    sections: contentStructure.sections.map(s => s.type),
    tokensUsed: 0, // Calculate from responses
    cost: 0
  };
}
```

### 5. Create Brand Kit Generator

Port `brand_kit_generator.py`:

```typescript
// brand-kit-generator.ts
import Anthropic from "@anthropic-ai/sdk";
import { BrandKit } from "./schemas";
import { BRAND_KIT_SYSTEM_PROMPT, EXTRACTION_PROMPT } from "./prompts/brand-kit-generation";
import { INDUSTRY_TEMPLATES } from "./prompts/industry-templates";

export interface BrandKitResult {
  brandKit: BrandKit;
  confidence: number;
  warnings: string[];
}

export async function generateBrandKit(
  unstructuredText: string,
  industryHint?: string
): Promise<BrandKitResult> {
  const client = new Anthropic();

  const industryContext = industryHint
    ? INDUSTRY_TEMPLATES[industryHint]
    : "";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: BRAND_KIT_SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: EXTRACTION_PROMPT
        .replace("{input}", unstructuredText)
        .replace("{industry_context}", industryContext)
    }]
  });

  // Parse, validate, and auto-fix
  const { brandKit, warnings } = parseAndValidate(response);
  const confidence = calculateConfidence(brandKit, warnings, unstructuredText);

  return { brandKit, confidence, warnings };
}
```

### 6. Add New Agent to Registry

```typescript
// src/lib/agents.ts - Add new agent

{
  id: "landing-page-generator",
  name: "Landing Page Generator",
  description: "Generates landing pages from text descriptions",
  systemPrompt: `You are a landing page generation assistant.

When the user provides text about a business or product:
1. First, extract brand information and create a brand kit
2. Generate a complete, responsive landing page
3. Write the HTML to generated.html in the workspace

${DESIGN_PRINCIPLES}

You have access to file tools to write the generated HTML.
Always explain what you're generating and why.`,
  allowedTools: ["Read", "Write", "Edit", "Glob", "Grep"],
  allowBash: false,
  restrictToWorkspace: true,
  icon: "sparkles",
  color: "purple",
  isBuiltin: true,
}
```

### 7. Create Dedicated API Routes

```typescript
// src/app/api/landing-page/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateLandingPage } from "@/lib/landing-page/orchestrator";

export async function POST(request: NextRequest) {
  const { brandKit, requirements } = await request.json();

  try {
    const result = await generateLandingPage(brandKit, requirements);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/landing-page/brand-kit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateBrandKit } from "@/lib/landing-page/brand-kit-generator";

export async function POST(request: NextRequest) {
  const { text, industryHint } = await request.json();

  try {
    const result = await generateBrandKit(text, industryHint);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Brand kit generation failed" },
      { status: 500 }
    );
  }
}
```

### 8. Update Agent Runner for Landing Page Mode

The landing page generator agent needs special handling - it should use the orchestrator directly rather than the generic SDK query:

```typescript
// src/lib/agent-runner.ts - Add special case

export async function* runAgent(
  sessionId: string,
  prompt: string,
  agentId: string,
  sdkSessionId?: string
): AsyncGenerator<SSEEvent> {
  const agentConfig = getAgentConfig(agentId);

  // Special handling for landing page generator
  if (agentId === "landing-page-generator") {
    yield* runLandingPageGenerator(sessionId, prompt);
    return;
  }

  // ... existing SDK-based flow
}

async function* runLandingPageGenerator(
  sessionId: string,
  prompt: string
): AsyncGenerator<SSEEvent> {
  const cwd = createWorkspace(sessionId);

  yield { type: "system", content: "Starting landing page generation..." };

  // Step 1: Generate brand kit
  yield { type: "assistant", content: "Analyzing your input to extract brand information..." };
  const { brandKit, confidence } = await generateBrandKit(prompt);
  yield {
    type: "assistant",
    content: `Brand kit extracted (${Math.round(confidence * 100)}% confidence):\n- Business: ${brandKit.name}\n- Colors: ${brandKit.colors.primary}, ${brandKit.colors.secondary}\n- Style: ${brandKit.personalityTraits.join(", ")}`
  };

  // Step 2: Generate landing page
  yield { type: "assistant", content: "Generating landing page HTML..." };
  yield { type: "tool", toolName: "LandingPageOrchestrator", content: "Running design system and content planner..." };

  const result = await generateLandingPage(brandKit, prompt);

  // Step 3: Write to workspace
  const outputPath = path.join(cwd, "generated.html");
  fs.writeFileSync(outputPath, result.html);

  yield { type: "tool", toolName: "Write", content: `Wrote ${result.html.length} characters to generated.html` };
  yield {
    type: "assistant",
    content: `Landing page generated successfully!\n\nSections: ${result.sections.join(", ")}\n\nThe HTML has been written to your workspace at generated.html`
  };

  yield {
    type: "result",
    costUsd: result.cost,
    turns: 1,
    result: "Landing page generated"
  };
}
```

### 9. Add Preview Capability (Optional Enhancement)

```typescript
// src/app/api/sessions/[id]/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getWorkspacePath } from "@/lib/workspace";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspacePath = getWorkspacePath(id);
  const htmlPath = path.join(workspacePath, "generated.html");

  if (!fs.existsSync(htmlPath)) {
    return NextResponse.json({ error: "No generated page" }, { status: 404 });
  }

  const html = fs.readFileSync(htmlPath, "utf-8");
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" }
  });
}
```

---

## UI Enhancements

### 1. Update Agent Selector Icon

```typescript
// agent-selector.tsx
const getIconEmoji = (icon: string) => {
  switch (icon) {
    case "terminal": return "⚡";
    case "shield": return "🛡️";
    case "sparkles": return "✨";  // Landing page generator
    default: return "🤖";
  }
};
```

### 2. Add Preview Button (Optional)

When using landing page generator, show a "Preview" button that opens the generated HTML in a new tab or iframe.

---

## File Changes Summary

**New files:**
```
src/lib/landing-page/
├── schemas.ts
├── prompts/
│   ├── design-principles.ts
│   ├── composition-patterns.ts
│   ├── responsive-guidelines.ts
│   ├── industry-templates.ts
│   └── brand-kit-generation.ts
├── agents/
│   ├── brand-analyst.ts
│   ├── design-system.ts
│   ├── content-planner.ts
│   └── html-generator.ts
├── orchestrator.ts
├── brand-kit-generator.ts
└── index.ts

src/app/api/landing-page/
├── generate/route.ts
├── brand-kit/route.ts
└── [Maybe: preview endpoint]
```

**Modified files:**
- `src/lib/agents.ts` - Add landing-page-generator agent
- `src/lib/agent-runner.ts` - Add special handling for landing page flow
- `src/components/dashboard/agent-selector.tsx` - Add sparkles icon
- `package.json` - Add @anthropic-ai/sdk dependency

---

## Dependencies

```bash
npm install @anthropic-ai/sdk
```

Note: This is in addition to `@anthropic-ai/claude-agent-sdk` which is already installed.

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...  # Already required
```

---

## Testing Checklist

- [ ] Brand kit generation from unstructured text
- [ ] Design system utility class generation
- [ ] Content structure planning
- [ ] HTML generation with only div/img/a/button
- [ ] Full orchestration flow
- [ ] SSE streaming of progress
- [ ] HTML written to workspace
- [ ] Preview endpoint works
- [ ] Agent shows in selector with ✨ icon
- [ ] Multiple sessions with different brand kits

---

## Example Usage Flow

1. User selects "Landing Page Generator" from agent dropdown
2. User creates new session
3. User pastes text like:
   ```
   We're TechFlow, a modern SaaS company that helps developers
   automate their workflows. Our brand is clean, professional,
   and developer-focused. We use a lot of purple and have a
   minimalist aesthetic. Our main product costs $29/month.
   ```
4. Agent responds with:
   - "Analyzing your input..."
   - "Brand kit extracted: TechFlow, purple primary, minimalist..."
   - "Generating landing page..."
   - "Done! HTML written to generated.html"
5. User can preview or download the generated HTML

---

## Future Enhancements (Out of Scope)

- Image generation with DALL-E 3
- Multiple page templates (not just landing pages)
- A/B variant generation
- Export to different formats (React components, etc.)
- Brand kit editor UI
- Live preview iframe in chat
