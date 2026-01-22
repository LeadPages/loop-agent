/**
 * Hero Layout Patterns - 8 Essential Layouts for Landing Page Heroes
 * Reference guide for AI landing page generators to ensure layout diversity.
 * Each layout is optimized for specific use cases.
 */

export interface HeroLayout {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  htmlStructure: string;
  cssPattern: string;
}

export const HERO_LAYOUTS: HeroLayout[] = [
  {
    id: "two-col-text-left",
    name: "Two-Column: Text Left / Image Right",
    description: "The classic layout — text and CTAs on left, hero image on right",
    bestFor: ["general", "saas", "services", "most landing pages"],
    htmlStructure: `
<!-- Two-Column: Text Left / Image Right -->
<div class="hero-section">
  <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <!-- Text Column (Left) -->
      <div class="order-2 lg:order-1">
        <div class="label-badge">{{LABEL}}</div>
        <div class="heading-primary mt-4">{{HEADLINE}}</div>
        <div class="body-large mt-6">{{SUBHEADLINE}}</div>
        <div class="flex flex-col sm:flex-row gap-4 mt-8">
          <a href="{{CTA_PRIMARY_HREF}}" class="cta-primary">{{CTA_PRIMARY_TEXT}}</a>
          <a href="{{CTA_SECONDARY_HREF}}" class="cta-secondary">{{CTA_SECONDARY_TEXT}}</a>
        </div>
      </div>
      <!-- Image Column (Right) -->
      <div class="order-1 lg:order-2">
        <div class="relative">
          <img src="{{HERO_IMAGE}}" alt="{{HERO_IMAGE_ALT}}" class="w-full rounded-2xl shadow-2xl" />
        </div>
      </div>
    </div>
  </div>
</div>`,
    cssPattern: "grid lg:grid-cols-2, text-left on desktop, image-right",
  },
  {
    id: "two-col-image-left",
    name: "Two-Column: Image Left / Text Right",
    description: "Reversed layout for visual variety and different reading patterns",
    bestFor: ["ecommerce", "portfolios", "visual brands", "products"],
    htmlStructure: `
<!-- Two-Column: Image Left / Text Right -->
<div class="hero-section">
  <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <!-- Image Column (Left) -->
      <div class="order-1">
        <div class="relative">
          <img src="{{HERO_IMAGE}}" alt="{{HERO_IMAGE_ALT}}" class="w-full rounded-2xl shadow-2xl" />
        </div>
      </div>
      <!-- Text Column (Right) -->
      <div class="order-2">
        <div class="label-badge">{{LABEL}}</div>
        <div class="heading-primary mt-4">{{HEADLINE}}</div>
        <div class="body-large mt-6">{{SUBHEADLINE}}</div>
        <div class="flex flex-col sm:flex-row gap-4 mt-8">
          <a href="{{CTA_PRIMARY_HREF}}" class="cta-primary">{{CTA_PRIMARY_TEXT}}</a>
          <a href="{{CTA_SECONDARY_HREF}}" class="cta-secondary">{{CTA_SECONDARY_TEXT}}</a>
        </div>
      </div>
    </div>
  </div>
</div>`,
    cssPattern: "grid lg:grid-cols-2, image-left on desktop, text-right",
  },
  {
    id: "centered-background-image",
    name: "Centered with Background Image",
    description: "Full-width background image with centered text overlay",
    bestFor: ["events", "hospitality", "luxury brands", "emotional appeals"],
    htmlStructure: `
<!-- Centered with Background Image -->
<div class="hero-section relative min-h-[80vh] flex items-center justify-center overflow-hidden">
  <!-- Background Image -->
  <div class="absolute inset-0">
    <img src="{{HERO_IMAGE}}" alt="{{HERO_IMAGE_ALT}}" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-black/50"></div>
  </div>
  <!-- Centered Content -->
  <div class="relative z-10 container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <div class="label-badge-light">{{LABEL}}</div>
    <div class="heading-primary text-white mt-4">{{HEADLINE}}</div>
    <div class="body-large text-white/90 mt-6 max-w-2xl mx-auto">{{SUBHEADLINE}}</div>
    <div class="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
      <a href="{{CTA_PRIMARY_HREF}}" class="cta-primary">{{CTA_PRIMARY_TEXT}}</a>
    </div>
  </div>
</div>`,
    cssPattern: "full-width background, centered overlay text, dark gradient overlay",
  },
  {
    id: "form-embedded",
    name: "Form Embedded Hero",
    description: "Lead capture form integrated directly into the hero section",
    bestFor: ["lead generation", "free trials", "newsletter signups", "consultations"],
    htmlStructure: `
<!-- Form Embedded Hero -->
<div class="hero-section">
  <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <!-- Text Column -->
      <div>
        <div class="label-badge">{{LABEL}}</div>
        <div class="heading-primary mt-4">{{HEADLINE}}</div>
        <div class="body-large mt-6">{{SUBHEADLINE}}</div>
        <!-- Bullet Points -->
        <div class="mt-8 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-primary"></div>
            <div class="text-gray-700">{{BENEFIT_1}}</div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-primary"></div>
            <div class="text-gray-700">{{BENEFIT_2}}</div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-primary"></div>
            <div class="text-gray-700">{{BENEFIT_3}}</div>
          </div>
        </div>
      </div>
      <!-- Form Column -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div class="font-heading text-2xl font-bold mb-6">{{FORM_TITLE}}</div>
        <div class="space-y-4">
          <div>
            <div class="text-sm text-gray-600 mb-1">Name</div>
            <div class="w-full h-12 border border-gray-200 rounded-lg bg-gray-50"></div>
          </div>
          <div>
            <div class="text-sm text-gray-600 mb-1">Email</div>
            <div class="w-full h-12 border border-gray-200 rounded-lg bg-gray-50"></div>
          </div>
          <div>
            <div class="text-sm text-gray-600 mb-1">Phone</div>
            <div class="w-full h-12 border border-gray-200 rounded-lg bg-gray-50"></div>
          </div>
          <button class="cta-primary w-full mt-4">{{CTA_PRIMARY_TEXT}}</button>
        </div>
      </div>
    </div>
  </div>
</div>`,
    cssPattern: "grid lg:grid-cols-2, text with bullets left, form card right",
  },
  {
    id: "product-centered",
    name: "Product-Centered Hero",
    description: "Product image takes center stage with content below",
    bestFor: ["ecommerce", "dtc brands", "single product focus", "app downloads"],
    htmlStructure: `
<!-- Product-Centered Hero -->
<div class="hero-section">
  <div class="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
    <div class="flex flex-col items-center text-center">
      <!-- Product Image (Prominent) -->
      <div class="relative w-full max-w-md mb-8">
        <img src="{{HERO_IMAGE}}" alt="{{HERO_IMAGE_ALT}}" class="w-full rounded-2xl shadow-2xl" />
      </div>
      <!-- Content Below -->
      <div class="heading-primary">{{HEADLINE}}</div>
      <div class="body-large mt-4 max-w-2xl">{{SUBHEADLINE}}</div>
      <!-- Price and CTA -->
      <div class="flex items-center gap-6 mt-8">
        <div class="font-heading text-4xl font-bold">{{PRICE}}</div>
        <a href="{{CTA_PRIMARY_HREF}}" class="cta-primary">{{CTA_PRIMARY_TEXT}}</a>
      </div>
    </div>
  </div>
</div>`,
    cssPattern: "centered layout, large product image top, text and price below",
  },
  {
    id: "video-demo",
    name: "Video/Demo Hero",
    description: "Video or demo embed prominent in the hero section",
    bestFor: ["saas demos", "online courses", "complex products", "software"],
    htmlStructure: `
<!-- Video/Demo Hero -->
<div class="hero-section">
  <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <!-- Text Column -->
      <div>
        <div class="label-badge">{{LABEL}}</div>
        <div class="heading-primary mt-4">{{HEADLINE}}</div>
        <div class="body-large mt-6">{{SUBHEADLINE}}</div>
        <div class="mt-8">
          <a href="{{CTA_PRIMARY_HREF}}" class="cta-primary">{{CTA_PRIMARY_TEXT}}</a>
        </div>
      </div>
      <!-- Video Column -->
      <div class="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        <img src="{{HERO_IMAGE}}" alt="{{HERO_IMAGE_ALT}}" class="w-full h-full object-cover opacity-80" />
        <!-- Play Button Overlay -->
        <div class="absolute inset-0 flex items-center justify-center">
          <button class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <div class="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-primary border-b-[12px] border-b-transparent ml-1"></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`,
    cssPattern: "grid lg:grid-cols-2, text left, video/demo placeholder right with play button",
  },
  {
    id: "stats-forward",
    name: "Stats-Forward Hero",
    description: "Key metrics and social proof featured prominently",
    bestFor: ["b2b saas", "enterprise", "credibility-driven industries"],
    htmlStructure: `
<!-- Stats-Forward Hero -->
<div class="hero-section">
  <div class="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
    <div class="text-center">
      <div class="label-badge mx-auto">{{LABEL}}</div>
      <div class="heading-primary mt-4">{{HEADLINE}}</div>
      <div class="body-large mt-6 max-w-2xl mx-auto">{{SUBHEADLINE}}</div>
      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-8 mt-12 py-8 bg-gray-50 rounded-2xl">
        <div class="text-center">
          <div class="font-heading text-4xl md:text-5xl font-bold text-primary">{{STAT_1_VALUE}}</div>
          <div class="text-gray-600 mt-1">{{STAT_1_LABEL}}</div>
        </div>
        <div class="text-center">
          <div class="font-heading text-4xl md:text-5xl font-bold text-primary">{{STAT_2_VALUE}}</div>
          <div class="text-gray-600 mt-1">{{STAT_2_LABEL}}</div>
        </div>
        <div class="text-center">
          <div class="font-heading text-4xl md:text-5xl font-bold text-primary">{{STAT_3_VALUE}}</div>
          <div class="text-gray-600 mt-1">{{STAT_3_LABEL}}</div>
        </div>
      </div>
      <!-- CTA -->
      <div class="mt-10">
        <a href="{{CTA_PRIMARY_HREF}}" class="cta-primary">{{CTA_PRIMARY_TEXT}}</a>
      </div>
    </div>
  </div>
</div>`,
    cssPattern: "centered text, prominent stats row with 3 columns, single CTA",
  },
  {
    id: "full-bleed-overlay",
    name: "Full-Bleed Overlay Hero",
    description: "Full-width image with gradient overlay and text positioned on one side",
    bestFor: ["luxury brands", "real estate", "travel", "lifestyle", "premium services"],
    htmlStructure: `
<!-- Full-Bleed Overlay Hero -->
<div class="hero-section relative min-h-[80vh] flex items-center overflow-hidden">
  <!-- Full-Bleed Background Image -->
  <div class="absolute inset-0">
    <img src="{{HERO_IMAGE}}" alt="{{HERO_IMAGE_ALT}}" class="w-full h-full object-cover" />
    <!-- Gradient Overlay (left side darker) -->
    <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
  </div>
  <!-- Content (Left Aligned) -->
  <div class="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="max-w-xl">
      <div class="label-badge-light">{{LABEL}}</div>
      <div class="heading-primary text-white mt-4">{{HEADLINE}}</div>
      <div class="body-large text-white/90 mt-6">{{SUBHEADLINE}}</div>
      <div class="mt-8">
        <a href="{{CTA_PRIMARY_HREF}}" class="cta-primary">{{CTA_PRIMARY_TEXT}}</a>
      </div>
    </div>
  </div>
</div>`,
    cssPattern: "full-bleed image, gradient overlay from left, text left-aligned over image",
  },
];

/**
 * Layout Selection Guide - Maps page goals and industries to recommended layouts
 */
export const LAYOUT_SELECTION_GUIDE = {
  byPageGoal: {
    leadCollection: ["form-embedded", "two-col-text-left"],
    clickThrough: ["centered-background-image", "two-col-text-left", "stats-forward"],
    purchase: ["product-centered", "two-col-image-left", "full-bleed-overlay"],
    informational: ["centered-background-image", "two-col-text-left"],
  },
  byIndustry: {
    events: ["centered-background-image", "full-bleed-overlay"],
    saas: ["stats-forward", "video-demo", "two-col-text-left"],
    b2b: ["stats-forward", "video-demo", "two-col-text-left"],
    ecommerce: ["product-centered", "two-col-image-left"],
    localServices: ["form-embedded", "two-col-text-left"],
    onlineCourses: ["video-demo", "two-col-text-left"],
    luxury: ["full-bleed-overlay", "centered-background-image"],
    lifestyle: ["full-bleed-overlay", "centered-background-image"],
    realEstate: ["full-bleed-overlay", "centered-background-image"],
    travel: ["full-bleed-overlay", "centered-background-image"],
    hospitality: ["centered-background-image", "full-bleed-overlay"],
    portfolio: ["two-col-image-left", "full-bleed-overlay"],
    agency: ["two-col-text-left", "stats-forward"],
  },
};

/**
 * Get a layout by ID
 */
export function getHeroLayout(id: string): HeroLayout | undefined {
  return HERO_LAYOUTS.find((layout) => layout.id === id);
}

/**
 * Select the best hero layout based on page goal, industry, and previously used layouts
 */
export function selectHeroLayout(
  pageGoal?: string,
  industry?: string,
  previousLayouts: string[] = []
): HeroLayout {
  // Build candidate list based on page goal and industry
  let candidates: string[] = [];

  // Add layouts from page goal
  if (pageGoal) {
    const goalKey = pageGoal.toLowerCase().replace(/\s+/g, "") as keyof typeof LAYOUT_SELECTION_GUIDE.byPageGoal;
    const goalLayouts = LAYOUT_SELECTION_GUIDE.byPageGoal[goalKey];
    if (goalLayouts) {
      candidates.push(...goalLayouts);
    }
  }

  // Add layouts from industry
  if (industry) {
    const industryKey = industry.toLowerCase().replace(/\s+/g, "") as keyof typeof LAYOUT_SELECTION_GUIDE.byIndustry;
    const industryLayouts = LAYOUT_SELECTION_GUIDE.byIndustry[industryKey];
    if (industryLayouts) {
      candidates.push(...industryLayouts);
    }
  }

  // If no specific matches, use all layouts
  if (candidates.length === 0) {
    candidates = HERO_LAYOUTS.map((l) => l.id);
  }

  // Remove duplicates
  candidates = [...new Set(candidates)];

  // Filter out previously used layouts to ensure variety
  let availableCandidates = candidates.filter((id) => !previousLayouts.includes(id));

  // If all candidates were previously used, reset and use all candidates
  if (availableCandidates.length === 0) {
    availableCandidates = candidates;
  }

  // Select the first available candidate (highest priority based on goal/industry match)
  const selectedId = availableCandidates[0];
  return getHeroLayout(selectedId) || HERO_LAYOUTS[0];
}

/**
 * Format hero layouts as a prompt string for the content planner
 */
export const HERO_LAYOUT_PATTERNS_PROMPT = `
## Hero Layout Patterns - CRITICAL FOR V2

You MUST select one of these 8 hero layout patterns for the hero section. Do NOT default to "two-col-text-left" every time.

### Available Hero Layouts:

1. **two-col-text-left** - Two-Column: Text Left / Image Right
   - Best for: General purpose, SaaS, services
   - Structure: Text/CTAs on left, hero image on right

2. **two-col-image-left** - Two-Column: Image Left / Text Right
   - Best for: E-commerce, portfolios, visual brands
   - Structure: Hero image on left, text/CTAs on right

3. **centered-background-image** - Centered with Background Image
   - Best for: Events, hospitality, luxury brands, emotional appeals
   - Structure: Full-width background image with centered text overlay

4. **form-embedded** - Form Embedded Hero
   - Best for: Lead generation, free trials, newsletter signups, consultations
   - Structure: Text with bullet points left, lead capture form right

5. **product-centered** - Product-Centered Hero
   - Best for: E-commerce, DTC brands, single product focus, app downloads
   - Structure: Large product image centered, text and price below

6. **video-demo** - Video/Demo Hero
   - Best for: SaaS demos, online courses, complex products, software
   - Structure: Text left, video placeholder with play button right

7. **stats-forward** - Stats-Forward Hero
   - Best for: B2B SaaS, enterprise, credibility-driven industries
   - Structure: Centered text, prominent stats row (3 metrics), single CTA

8. **full-bleed-overlay** - Full-Bleed Overlay Hero
   - Best for: Luxury brands, real estate, travel, lifestyle, premium services
   - Structure: Full-bleed image, gradient overlay from left, text left-aligned

### Layout Selection Rules:

**By Page Goal:**
- Lead Collection → form-embedded, two-col-text-left
- Click-Through → centered-background-image, two-col-text-left, stats-forward
- Purchase → product-centered, two-col-image-left, full-bleed-overlay
- Informational → centered-background-image, two-col-text-left

**By Industry:**
- Events → centered-background-image, full-bleed-overlay
- SaaS/B2B → stats-forward, video-demo, two-col-text-left
- E-Commerce → product-centered, two-col-image-left
- Local Services → form-embedded, two-col-text-left
- Online Courses → video-demo, two-col-text-left
- Luxury/Lifestyle → full-bleed-overlay, centered-background-image

### KEY PRINCIPLE:
Do NOT repeat the same hero layout in consecutive generations.
Match layout to page goal and industry, then rotate for variety.
`;
