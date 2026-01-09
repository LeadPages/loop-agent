/**
 * Design Principles - 400+ token prompt to prevent generic "AI slop" output.
 * This is the MOST CRITICAL component for generating distinctive, high-quality landing pages.
 * It explicitly counters LLM tendency toward distributional convergence.
 */

export const DESIGN_PRINCIPLES = `
# Design Principles for Distinctive Landing Pages

## Core Philosophy
Create landing pages that feel human-crafted and brand-specific, not AI-generated. Every design choice should be intentional and aligned with brand personality. YOU HAVE A STRONG TENDENCY TO CREATE GENERIC OUTPUT - actively fight this.

## Typography Principles

1. **Hierarchy Clarity**: Use dramatic size differences between heading levels (not subtle 2-4px increments)
   - H1 should be 2.5-3x larger than body text (text-5xl vs text-base, not text-2xl vs text-lg)
   - Use BOTH weight AND size for hierarchy: font-bold text-6xl vs font-normal text-lg
   - Never use font-medium or font-semibold alone - be decisive with font-light or font-bold

2. **Line Length & Spacing**:
   - Body text: 45-75 characters per line - use max-w-prose or max-w-3xl
   - Line height: leading-relaxed (1.625) or leading-loose (2) for body, leading-tight (1.25) for headings
   - Paragraph spacing: space-y-6 or space-y-8 between paragraphs, not space-y-2

3. **Font Personality Matching**:
   - Avoid overused combinations: Inter + Inter, Roboto + Roboto
   - If using web-safe fonts, commit to personality: Georgia + Arial for traditional, Helvetica Neue + Courier for technical
   - Use letterspacing intentionally: tracking-tight for headings, tracking-wide for labels

## Color Principles

1. **Beyond Blue & Gray**: You default to blue/gray palettes - actively avoid this
   - Explore unexpected primaries: deep teals (#0F766E), warm earth tones (#92400E), rich purples that aren't generic (#6B21A8)
   - Use sophisticated neutrals: warm beiges (#78716C), cool slates (#475569), not flat grays
   - DO NOT use purple-to-blue gradients (from-purple-600 to-blue-600) - this screams AI-generated

2. **Color Relationships**:
   - 60-30-10 rule strictly: 60% dominant (backgrounds), 30% secondary (sections), 10% accent (CTAs)
   - Ensure 4.5:1 contrast ratio minimum for text (WCAG AA compliance)
   - Use color to convey meaning, but explore variations: success doesn't have to be #10B981

3. **Gradients & Overlays**:
   - Subtle gradients only: from-primary-50 to-primary-100, not from-primary-500 to-blue-500
   - Gradient directions matter: to-br (bottom-right) creates depth, to-r (right) creates motion
   - Never use gradients at full saturation

## Layout & Composition

1. **White Space is Active Space**:
   - Use generous padding: py-16 md:py-24 lg:py-32 for sections (not py-8)
   - Create breathing room around important elements: space-y-8, not space-y-4
   - Asymmetric spacing creates visual interest: pt-20 pb-16, not py-18

2. **Grid Discipline**:
   - Establish clear vertical rhythm with 8px or 4px base unit
   - Align elements to grid even with limited primitives: use gap-8, gap-12, gap-16 (not gap-6)
   - Use consistent gap sizes within a section

3. **Responsive Composition Changes**:
   - Don't just stack on mobile - reconsider hierarchy
   - Images can reposition: order-first on mobile, order-last on desktop
   - Hide decorative elements on mobile: hidden sm:block
   - Mobile gets simplified layouts, desktop gets richer compositions

## Motion & Interaction

1. **Purposeful Transitions**:
   - Use duration-200 for frequent interactions (buttons, links hover)
   - Use duration-300 or duration-500 for page elements (cards appearing)
   - Animate ONE property at a time: transition-colors, transition-transform, not transition-all

2. **Hover States** (CRITICAL - you often forget these):
   - ALWAYS define hover states for interactive elements
   - Go beyond color changes: hover:scale-105 hover:shadow-xl transition-all
   - Buttons must have: hover:bg-*, hover:shadow-*, hover:translate-y-*
   - Links must have: hover:text-*, hover:underline, or hover:opacity-*

## Anti-Patterns to ACTIVELY AVOID

These are AI slop indicators. Your training data contains these patterns. DO NOT use them:

1. **Layout Anti-Patterns**:
   - Everything perfectly centered (items-center justify-center on every div)
   - Equal spacing between all sections (py-16 repeated identically)
   - Three identical feature cards in perfect grid with no variation
   - Symmetrical everything (use asymmetry: grid-cols-3 with col-span-2 on one item)

2. **Visual Anti-Patterns**:
   - All rounded corners at same radius (rounded-lg everywhere)
   - Shadow-lg on everything (use shadow scale intentionally)
   - Purple-to-blue gradients (from-purple-600 to-blue-600)
   - Timid, evenly-distributed color palettes
   - Generic hero: centered text over stock photo

3. **Typography Anti-Patterns**:
   - Subtle size differences: text-2xl vs text-xl (too similar)
   - All text the same weight
   - No line-height variation
   - Uniform text-gray-600 for all body copy

4. **Interaction Anti-Patterns**:
   - No hover states defined
   - Static pages with no transitions
   - All buttons look identical

## Distinctive Techniques

Use these to create memorable, non-generic designs:

1. **Layering & Depth**:
   - Use shadow scale intentionally: shadow-sm for subtle, shadow-2xl for dramatic
   - Create depth with multiple layers: background gradient + foreground card + shadow
   - Overlap elements slightly: -mt-8 to pull card up over previous section

2. **Asymmetry**:
   - Offset images: grid lg:grid-cols-[1.2fr_1fr] (60/40 split)
   - Vary column widths: not always grid-cols-2, use grid-cols-3 with col-span-2
   - Use odd numbers: grid-cols-3, grid-cols-5 (not grid-cols-2, grid-cols-4)

3. **Typography Texture**:
   - Mix weights within headings: <div class="text-6xl"><span class="font-light">Light</span> <span class="font-bold">Bold</span></div>
   - Use letter-spacing strategically: tracking-tight for impact, tracking-wide for sophistication
   - Capitalize strategically: uppercase text-xs tracking-widest for labels, NOT for headings

4. **Composition Techniques with Primitives**:
   - Create visual hierarchy with nested divs and backgrounds
   - Use border-l-4 or border-t-4 for accent lines
   - Use negative margins for overlapping: -mt-16
   - Create shapes with rounded corners: rounded-t-3xl, rounded-br-3xl

## Mobile-First Specifics

1. **Base Styles = Mobile** (you often forget this):
   - Start with mobile typography: text-2xl md:text-4xl lg:text-6xl
   - Mobile padding: px-4 py-12, then scale up: md:px-8 md:py-16 lg:px-12 lg:py-24
   - Single column by default: grid-cols-1 lg:grid-cols-2

2. **Progressive Enhancement**:
   - Add md: prefix for tablets (768px+)
   - Add lg: prefix for desktops (1024px+)
   - Add xl: prefix for large screens (1280px+)
   - NEVER skip breakpoints: text-sm lg:text-2xl (missing md:) is wrong

3. **Touch Targets**:
   - Minimum 44x44px for buttons: py-3 px-6 (not py-1 px-2)
   - Adequate spacing between clickable elements: space-y-4 (not space-y-1)
   - Larger text inputs on mobile: text-base (not text-sm)

## Brand Consistency

1. **Token Application**:
   - Use brand colors throughout with Tailwind arbitrary values: bg-[#6366F1]
   - Apply typography scale consistently: if brand defines 2xl as 1.5rem, use text-2xl
   - Maintain spacing scale: if brand uses 8px units, use multiples of 2 (gap-2, gap-4, gap-8)

2. **Personality Expression**:
   - Professional = clean lines, spacious, serif headings, muted colors
   - Playful = rounded corners, bright accents, asymmetric layouts, bold typography
   - Luxury = ample white space, elegant typography, subtle colors, minimal decorations
   - Tech = sharp edges (rounded-sm), bold typography, high contrast, geometric shapes

## Critical Reminders

- You WILL tend toward generic blue/purple gradients - actively resist
- You WILL forget hover states - add them EVERY TIME
- You WILL create equal spacing - vary your rhythm
- You WILL center everything - use asymmetry
- You WILL use timid type scale - be BOLD with size differences

Apply these principles rigorously to create landing pages that feel intentionally designed by a human, not generated by an AI.
`;

export function getDesignPrinciples(): string {
  return DESIGN_PRINCIPLES;
}
