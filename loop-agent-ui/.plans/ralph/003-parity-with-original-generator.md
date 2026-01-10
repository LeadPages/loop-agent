# Plan: Achieve Parity with Original Landing Page Generator

## Executive Summary

The TypeScript implementation is architecturally similar to the Python original but has several gaps affecting output quality. This plan addresses those gaps to achieve visual parity with examples like `joint_burger.html`.

---

## Gap Analysis

### What the Original Does Better

| Area | Original (Python) | Current (TypeScript) | Impact |
|------|-------------------|---------------------|--------|
| **Design Principles** | 172-line prompt embedded in Design System | Present but may not be passed to all agents | High |
| **Composition Patterns** | Full 7-pattern library used | Present but unclear if used | High |
| **HTML Structure** | Detailed head with fonts/meta | Recently added but untested | Medium |
| **Utility Classes** | 11 core classes with hover states | Same structure, fallback only | Medium |
| **Image Context** | Explicit image_context per section | Using imagesNeeded array | Low |
| **Validation** | Breakpoint progression validation | Not implemented | Low |

---

## Priority 1: Design Principles Integration (HIGH IMPACT)

### Problem
The `DESIGN_PRINCIPLES` constant exists in `prompts/design-principles.ts` but it's only imported by `design-system.ts`. The HTML Generator doesn't receive these anti-AI-slop principles.

### Current State
```typescript
// design-system.ts
import { DESIGN_PRINCIPLES } from "../prompts/design-principles";

export const DESIGN_SYSTEM_SYSTEM_PROMPT = `
...
${DESIGN_PRINCIPLES}
...
`;
```

### Missing From
- `html-generator.ts` - CRITICAL: This is where visual decisions are made
- `content-planner.ts` - Affects layout choices

### Solution
Add `DESIGN_PRINCIPLES` to HTML Generator system prompt:

```typescript
// html-generator.ts
import { DESIGN_PRINCIPLES } from "../prompts/design-principles";

export const HTML_GENERATOR_SYSTEM_PROMPT = `
You are an HTML Generator...

## Design Principles - CRITICAL
${DESIGN_PRINCIPLES}

## CRITICAL CONSTRAINT
...
`;
```

### Implementation Steps
1. Import `DESIGN_PRINCIPLES` in `html-generator.ts`
2. Add it prominently in the system prompt (before constraints)
3. Consider adding to `content-planner.ts` for layout decisions

---

## Priority 2: Composition Pattern Usage (HIGH IMPACT)

### Problem
The `COMPOSITION_PATTERNS` constant exists but it's unclear if the patterns are being applied during HTML generation.

### Current Flow
```
Content Planner → sections with compositionPattern field
HTML Generator → receives contentStructure but may ignore patterns
```

### Verification Needed
1. Check if `compositionPattern` from content structure is used
2. Verify HTML Generator references patterns when building sections

### Solution
Ensure composition patterns are explicitly referenced in HTML Generator prompt:

```typescript
// In createHtmlGeneratorPrompt
# Composition Patterns Reference
${COMPOSITION_PATTERNS}

# Task
For each section:
- Look up the compositionPattern field
- Apply the exact HTML structure from the pattern
- ...
```

### Implementation Steps
1. Import `COMPOSITION_PATTERNS` in `html-generator.ts`
2. Add patterns reference to the prompt
3. Explicitly instruct Claude to match pattern structures

---

## Priority 3: Hover States & Transitions (HIGH IMPACT)

### Problem
The original explicitly emphasizes hover states in multiple places:
- Design Principles: "You WILL forget hover states - add them EVERY TIME"
- Utility Classes: Include hover variants
- HTML Generation: Buttons must have hover states

### Current State
Utility classes include hover states, but HTML Generator may not apply them consistently.

### Solution
Add explicit hover state reminder in HTML Generator:

```typescript
## CRITICAL: Hover States

EVERY interactive element MUST have hover states:
- Buttons: hover:bg-opacity-90 hover:shadow-lg hover:-translate-y-0.5
- Links: hover:text-[accent] hover:underline
- Cards: hover:shadow-xl hover:-translate-y-1
- Images: hover:scale-105 (in containers with overflow-hidden)

Add transitions: transition-all duration-200

You WILL forget this. Add hover states to EVERY button, link, and card.
```

### Implementation Steps
1. Add hover state section to HTML Generator prompt
2. Include specific examples for each element type
3. Add to Critical Reminders section

---

## Priority 4: Typography Execution (MEDIUM IMPACT)

### Problem
The joint_burger.html has dramatic typography:
- H1: `text-5xl md:text-6xl lg:text-7xl` (massive)
- Body: `text-lg md:text-xl`
- Labels: `text-sm tracking-wide uppercase`

### Current State
Utility classes define this, but HTML may not use them correctly.

### Solution
Add typography examples to HTML Generator:

```typescript
## Typography Hierarchy Examples

Hero headline (use font-heading class):
<div class="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-[${primary}] leading-[0.95]">
  BOLD HEADLINE
</div>

Supporting text:
<div class="text-lg md:text-xl text-[${neutral[6]}] leading-relaxed max-w-2xl">
  Description text here
</div>

Labels/badges:
<div class="text-sm font-semibold tracking-wide uppercase text-[${accent}]">
  CATEGORY
</div>
```

---

## Priority 5: Section Background Colors (MEDIUM IMPACT)

### Problem
joint_burger.html alternates section backgrounds:
- Hero: `bg-gradient-to-br from-[#FFF8F5] via-[#FFFFFF] to-[#FDF2EC]`
- Features: `bg-[#FFFFFF]`
- Menu: `bg-gradient-to-b from-[#FDF2EC] to-[#FFF8F5]`
- CTA: `bg-gradient-to-br from-[#FF6B35] to-[#D32F2F]`

### Current State
May be generating all sections with same background.

### Solution
Add background pattern guidance:

```typescript
## Section Background Patterns

Alternate backgrounds to create visual rhythm:
1. Hero: Subtle gradient using brand colors (from-[${neutral[0]}] to-[${neutral[1]}])
2. Features: Clean white bg-[#FFFFFF]
3. Testimonials: Light tint bg-[${primary}]/5
4. CTA: Bold gradient from-[${primary}] to-[${accent}]
5. Footer: Dark bg-[${neutral[9]}]

NEVER use the same background for adjacent sections.
```

---

## Priority 6: Sticky Header (MEDIUM IMPACT)

### Problem
joint_burger.html has a sticky header:
```html
<div class="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#F5E6E0] shadow-sm">
```

### Current State
May not be generating sticky headers.

### Solution
Add header pattern to composition patterns or HTML Generator:

```typescript
## Navigation Header Pattern

Always include a sticky header:
<div class="sticky top-0 z-50 bg-[${bgColor}] border-b border-[${neutral[2]}] shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16 md:h-20">
      <!-- Logo -->
      <!-- Nav links (hidden lg:flex) -->
      <!-- CTA button -->
      <!-- Mobile menu button (lg:hidden) -->
    </div>
  </div>
</div>
```

---

## Priority 7: Footer Structure (LOW IMPACT)

### Problem
joint_burger.html has a comprehensive multi-column footer.

### Current State
Footer may be minimal or missing.

### Solution
Add footer pattern guidance in content planner and HTML generator.

---

## Implementation Order

### Phase 1: Critical Quality Fixes (Do First)
1. Add `DESIGN_PRINCIPLES` to HTML Generator ← **Most impactful**
2. Add hover state reminders
3. Add typography examples

### Phase 2: Structure Improvements
4. Add `COMPOSITION_PATTERNS` reference
5. Add section background guidance
6. Add sticky header pattern

### Phase 3: Polish
7. Add footer structure
8. Add validation for breakpoint progression
9. Test with various business types

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `agents/html-generator.ts` | Add DESIGN_PRINCIPLES, hover states, typography, backgrounds | P1 |
| `agents/content-planner.ts` | Add DESIGN_PRINCIPLES for layout decisions | P2 |
| `prompts/composition-patterns.ts` | Verify patterns match original | P2 |

---

## Success Criteria

Generated pages should have:
- [ ] Dramatic typography hierarchy (H1 visibly 2.5-3x larger than body)
- [ ] Hover states on ALL interactive elements
- [ ] Alternating section backgrounds
- [ ] Sticky navigation header
- [ ] Google Fonts loading correctly
- [ ] Real Unsplash images loading
- [ ] Brand colors applied throughout
- [ ] Mobile-responsive layout
- [ ] No purple-blue gradients (anti-AI-slop)
- [ ] Asymmetric layouts where appropriate

---

## Estimated Effort

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 1 | 3 tasks | Low - prompt additions |
| Phase 2 | 3 tasks | Medium - structural changes |
| Phase 3 | 3 tasks | Low - polish |

**Total: ~2-3 hours of implementation**

---

## Testing Plan

1. Generate landing page for "burger restaurant"
2. Compare visually to joint_burger.html
3. Check for:
   - Font loading (inspect Network tab)
   - Hover states (hover over buttons)
   - Image loading (Unsplash URLs)
   - Typography scale (visually dramatic?)
   - Section backgrounds (alternating?)
   - Header sticky behavior (scroll test)
