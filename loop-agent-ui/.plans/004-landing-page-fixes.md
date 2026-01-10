# Plan: Landing Page Generator Fixes and Enhancements

## Overview

This plan addresses four issues with the landing page generator:
1. HTML/CSS styling issues
2. Broken Unsplash images
3. Missing reload button for preview
4. Missing model selector for development

---

## Issue 1: Fix HTML/CSS Styling Issues

### Problem Analysis
The generated landing page styles look off due to several factors:
1. **Font Loading Issues**: Google Fonts URLs may not be properly formatted
2. **Tailwind CDN limitations**: Default CDN does not include custom colors from brand kit
3. **Body font-family inheritance**: Body text may not inherit the body font class

### Solution

#### A. Add Tailwind Config Inline Script
Modify HTML template to include Tailwind config that extends with brand colors:
```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '${brandKit.colors.primary}',
          secondary: '${brandKit.colors.secondary}',
          accent: '${brandKit.colors.accent}',
        }
      }
    }
  }
</script>
```

#### B. Fix Font Loading
- Provide actual Google Fonts URL examples
- Include fallback fonts in the style block

#### C. Add CSS Reset/Normalization
```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; }
img { max-width: 100%; display: block; }
```

### Files to Modify
- `src/lib/landing-page/agents/html-generator.ts`

---

## Issue 2: Fix Broken Unsplash Images

### Problem Analysis
Claude generates Unsplash URLs from its base knowledge (e.g., `photo-1568901346375-23c9450c58cd`), but these photo IDs may not exist or may have been removed.

### Solution

#### A. Create Image Validation Service
New module to validate Unsplash URLs and replace with fallbacks:

```typescript
// src/lib/landing-page/image-validator.ts

export async function validateUnsplashUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function validateAndReplaceImages(html: string): Promise<string> {
  const unsplashRegex = /https:\/\/images\.unsplash\.com\/photo-[^"'\s]+/g;
  const urls = [...new Set(html.match(unsplashRegex) || [])];

  let result = html;
  for (const url of urls) {
    const isValid = await validateUnsplashUrl(url);
    if (!isValid) {
      const fallbackUrl = getFallbackUrl(url);
      result = result.replaceAll(url, fallbackUrl);
    }
  }

  return result;
}

function getFallbackUrl(originalUrl: string): string {
  // Extract width/height from original URL params
  const urlObj = new URL(originalUrl);
  const width = urlObj.searchParams.get('w') || '800';
  const height = urlObj.searchParams.get('h') || '600';
  // Use Picsum.photos as reliable fallback
  const seed = Date.now().toString(36);
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
```

#### B. Update Orchestrator
Add image validation step after HTML generation:
```typescript
// After HTML generation, before returning:
this.finalHtml = await validateAndReplaceImages(this.htmlDraft);
```

#### C. Alternative: Use Picsum.photos in Prompt
Update HTML generator prompt to use Picsum.photos:
```
Use https://picsum.photos for images:
- Format: https://picsum.photos/seed/{KEYWORD}/{WIDTH}/{HEIGHT}
- Example: https://picsum.photos/seed/burger/800/600
```

### Files to Create/Modify
- **Create**: `src/lib/landing-page/image-validator.ts`
- **Modify**: `src/lib/landing-page/orchestrator.ts`
- **Modify**: `src/lib/landing-page/agents/html-generator.ts`

---

## Issue 3: Add Reload Button for Preview

### Problem Analysis
Users need to reload the iframe preview to see console errors without reloading the entire page.

### Solution

#### A. Add State for iframe Key
```typescript
const [previewKey, setPreviewKey] = useState(0);

const handleReloadPreview = useCallback(() => {
  setPreviewKey(prev => prev + 1);
}, []);
```

#### B. Add Reload Button to Preview Header
```tsx
<Button variant="ghost" size="icon" onClick={handleReloadPreview} title="Reload preview">
  <RotateCw className="w-4 h-4" />
</Button>
```

#### C. Add Key to iframe
```tsx
<iframe key={previewKey} src={...} />
```

### Files to Modify
- `src/app/page.tsx`

---

## Issue 4: Add Model Selector

### Problem Analysis
Model is hardcoded to `claude-sonnet-4-20250514`. Need to switch between Haiku/Sonnet/Opus.

### Current State
- `sdk-client.ts`: Default model `"claude-sonnet-4-20250514"`, accepts model as option
- `orchestrator.ts`: Stores model but **never passes to sub-agents**

### Solution

#### A. Create Model Selector Component
```typescript
// src/components/dashboard/model-selector.tsx

export const AVAILABLE_MODELS = [
  { id: "claude-haiku-3-5-20241022", name: "Haiku", description: "Fast & cheap" },
  { id: "claude-sonnet-4-20250514", name: "Sonnet", description: "Balanced" },
  { id: "claude-opus-4-5-20251101", name: "Opus", description: "Most capable" },
];
```

#### B. Add Model State to Dashboard
```typescript
const [selectedModelId, setSelectedModelId] = useState("claude-sonnet-4-20250514");
```

#### C. Add Model Selector to Sidebar (for landing page generator)

#### D. Pass Model through API
- Update `/api/sessions/[id]/message` route to accept `model` in request body
- Update `agent-runner.ts` to accept and pass model
- Update `orchestrator.ts` to pass model to sub-agents
- Update each agent function to use model parameter

### Files to Create/Modify
- **Create**: `src/components/dashboard/model-selector.tsx`
- **Modify**: `src/app/page.tsx`
- **Modify**: `src/app/api/sessions/[id]/message/route.ts`
- **Modify**: `src/lib/agent-runner.ts`
- **Modify**: `src/lib/landing-page/orchestrator.ts`
- **Modify**: `src/lib/landing-page/agents/design-system.ts`
- **Modify**: `src/lib/landing-page/agents/content-planner.ts`
- **Modify**: `src/lib/landing-page/agents/html-generator.ts`
- **Modify**: `src/lib/landing-page/sdk-client.ts`

---

## Implementation Order

### Phase 1: Quick Wins (Low Risk)
1. **Add reload button** - Isolated UI change
2. **Add model selector** - UI + prop threading

### Phase 2: Image Fixes (Medium Risk)
3. **Fix broken Unsplash images** - Create validation, fallback to Picsum

### Phase 3: Styling Fixes (Higher Risk)
4. **Fix HTML/CSS styling** - Prompt engineering, may require iteration

---

## Testing Plan

### Reload Button
- Generate a landing page
- Click reload button
- Verify iframe reloads (check Network tab)

### Model Selector
- Select Haiku model
- Generate landing page
- Verify faster response
- Check logs for correct model

### Images
- Generate landing page
- Verify all images load (no broken icons)
- Check Network tab for 404s

### Styling
- Generate landing page for "burger restaurant"
- Verify fonts load
- Verify brand colors applied
- Check responsive behavior
