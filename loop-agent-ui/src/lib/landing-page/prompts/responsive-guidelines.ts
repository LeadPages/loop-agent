/**
 * Responsive Design Guidelines - Mobile-first methodology and breakpoint instructions.
 */

export const RESPONSIVE_GUIDELINES = `
# Responsive Design Guidelines

## Mobile-First Methodology

**CRITICAL**: Always start with mobile styles (base classes), then progressively enhance for larger screens.

## Breakpoint Reference

- **Base** (no prefix): Mobile < 640px
- **sm:**: Small tablets 640px and up
- **md:**: Tablets 768px and up
- **lg:**: Desktops 1024px and up
- **xl:**: Large desktops 1280px and up
- **2xl:**: Extra large 1536px and up

## Typography Responsive Patterns

\`\`\`
CORRECT (mobile-first):
text-2xl md:text-4xl lg:text-6xl

WRONG (desktop-first):
text-6xl md:text-4xl sm:text-2xl

WRONG (skipped breakpoints):
text-2xl lg:text-6xl  (missing md:)
\`\`\`

## Layout Behavior by Breakpoint

### Hero Sections
- **Mobile**: Stack vertically, image below content
- **Tablet (md:)**: Begin side-by-side with tight spacing
- **Desktop (lg:)**: Full side-by-side with generous spacing

\`\`\`
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
\`\`\`

### Feature Grids
- **Mobile**: Single column
- **Tablet (md:)**: 2 columns
- **Desktop (lg:)**: 3 columns

\`\`\`
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
\`\`\`

### Pricing Cards
- **Mobile**: Single column, stacked
- **Tablet (md:)**: 2 columns if 2-3 tiers
- **Desktop (lg:)**: 3 columns for 3-tier, horizontal for all

\`\`\`
<div class="flex flex-col md:flex-row lg:flex-row gap-6 md:gap-4 lg:gap-6">
\`\`\`

## Spacing Responsive Patterns

### Section Padding
\`\`\`
py-12 md:py-16 lg:py-24
px-4 md:px-8 lg:px-12
\`\`\`

### Content Containers
\`\`\`
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
\`\`\`

### Element Spacing
\`\`\`
space-y-6 md:space-y-8 lg:space-y-12
gap-4 md:gap-6 lg:gap-8
\`\`\`

## Touch Target Requirements

### Mobile (base)
- **Buttons**: Minimum py-3 px-6 (44x44px minimum)
- **Links**: Minimum py-2 px-3
- **Spacing**: Minimum space-y-4 between interactive elements

### Desktop (lg:)
- Can be slightly smaller: py-2.5 px-5
- Tighter spacing acceptable: space-y-2

## Image Handling

### Responsive Images
\`\`\`
<img class="w-full md:w-auto lg:w-full object-cover aspect-square md:aspect-video lg:aspect-auto" />
\`\`\`

### Image Positioning
\`\`\`
Mobile: order-first (image on top)
Desktop: order-last (image on right)

<div class="order-first lg:order-last">
\`\`\`

## Display & Visibility

### Hide/Show Elements
\`\`\`
<!-- Show only on desktop -->
<div class="hidden lg:block">

<!-- Show only on mobile -->
<div class="block lg:hidden">

<!-- Hide on mobile, show on tablet+ -->
<div class="hidden md:block">
\`\`\`

## Validation Rules

1. **Breakpoint Progression**: Must use base -> sm: -> md: -> lg: -> xl: in order
2. **No Skipping**: Don't jump from base to lg: without md:
3. **Touch Targets**: Minimum 44x44px on mobile (py-3 px-6 for buttons)
4. **Container Usage**: Always use max-w-* with mx-auto for content
5. **Mobile-First**: Base styles must be mobile styles

## Common Mistakes to Avoid

- Identical classes at all breakpoints: \`text-4xl md:text-4xl lg:text-4xl\`
- Skipped breakpoints: \`text-sm lg:text-4xl\`
- Tiny touch targets: \`py-1 px-2\`
- No max-width constraints: Missing \`max-w-*\`
- Desktop-first thinking: Starting with large sizes and making smaller
`;

export function getResponsiveGuidelines(): string {
  return RESPONSIVE_GUIDELINES;
}
