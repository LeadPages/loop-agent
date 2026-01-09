/**
 * Composition Patterns - Common landing page section patterns using only div, img, a, button.
 */

export const COMPOSITION_PATTERNS = `
# Composition Patterns for Landing Page Sections

Remember: You only have div, img, a, button. Use these creatively with Tailwind classes.

## Hero Section Patterns

### 1. Centered Hero with Side Image

**Use Case**: SaaS, product launches, app landing pages
**Layout**: Left: content (60%), Right: image (40%)

\`\`\`html
<div class="min-h-screen flex items-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
  <div class="max-w-7xl mx-auto w-full">
    <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
      <!-- Content Column -->
      <div class="space-y-8">
        <div class="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-primary-900">
          Your Headline Here
        </div>
        <div class="text-xl md:text-2xl leading-relaxed text-neutral-700 max-w-2xl">
          Compelling subheadline that explains the value proposition clearly
        </div>
        <div class="flex flex-col sm:flex-row gap-4">
          <a href="#signup" class="bg-accent-600 hover:bg-accent-700 text-white text-lg font-semibold py-4 px-8 rounded-lg transition-colors duration-200 text-center">
            Get Started Free
          </a>
          <button class="bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 text-lg font-semibold py-4 px-8 rounded-lg transition-all duration-200">
            Watch Demo
          </button>
        </div>
      </div>
      <!-- Image Column -->
      <div class="relative">
        <img src="{{IMAGE_URL}}" alt="Hero illustration" class="w-full h-auto rounded-2xl shadow-2xl" />
      </div>
    </div>
  </div>
</div>
\`\`\`

### 2. Full-Width Background Hero

**Use Case**: Bold statements, brand-focused pages
**Layout**: Centered content over full-width background

\`\`\`html
<div class="relative min-h-screen flex items-center justify-center px-4 py-12">
  <!-- Background Image (use style attribute for dynamic URL) -->
  <div class="absolute inset-0 bg-cover bg-center opacity-20" style="background-image: url('{{IMAGE_URL}}')"></div>

  <!-- Content -->
  <div class="relative z-10 max-w-4xl text-center space-y-8">
    <div class="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
      Bold Statement
    </div>
    <div class="text-2xl md:text-3xl leading-relaxed text-neutral-700">
      Supporting message
    </div>
    <div>
      <a href="#" class="inline-block bg-accent-600 hover:bg-accent-700 hover:scale-105 text-white text-xl font-bold py-5 px-10 rounded-lg transition-all duration-200 shadow-xl">
        Take Action
      </a>
    </div>
  </div>
</div>
\`\`\`

## Feature Section Patterns

### 3. Three-Column Grid

**Use Case**: Feature highlights, benefits, services
**Layout**: Equal-width columns with icon/image, heading, description

\`\`\`html
<div class="py-24 px-4 bg-white">
  <div class="max-w-7xl mx-auto">
    <!-- Section Header -->
    <div class="text-center mb-16 space-y-4">
      <div class="text-5xl md:text-6xl font-bold">Features</div>
      <div class="text-xl text-neutral-600 max-w-2xl mx-auto">
        Everything you need to succeed
      </div>
    </div>

    <!-- Feature Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
      <!-- Feature Card -->
      <div class="space-y-4 p-8 rounded-2xl hover:bg-neutral-50 transition-colors duration-200">
        <div class="w-16 h-16 bg-accent-100 rounded-lg flex items-center justify-center">
          <img src="{{ICON_URL}}" alt="Feature icon" class="w-8 h-8" />
        </div>
        <div class="text-2xl font-bold text-primary-900">
          Feature Title
        </div>
        <div class="text-lg leading-relaxed text-neutral-600">
          Description of the feature and its benefits to users.
        </div>
      </div>

      <!-- Repeat for other features -->
    </div>
  </div>
</div>
\`\`\`

### 4. Alternating Feature Rows

**Use Case**: Detailed features, product showcases
**Layout**: Alternating image left/right with content

\`\`\`html
<div class="py-24 px-4">
  <div class="max-w-7xl mx-auto space-y-32">
    <!-- Feature Row 1 (Image Left) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div class="order-2 lg:order-1">
        <img src="{{IMAGE_URL}}" alt="Feature" class="w-full rounded-2xl shadow-xl" />
      </div>
      <div class="order-1 lg:order-2 space-y-6">
        <div class="text-4xl md:text-5xl font-bold">Feature Name</div>
        <div class="text-xl leading-relaxed text-neutral-700">
          Detailed explanation of this feature and how it helps users.
        </div>
        <a href="#" class="inline-block text-accent-600 hover:text-accent-700 font-semibold text-lg">
          Learn more
        </a>
      </div>
    </div>

    <!-- Feature Row 2 (Image Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div class="space-y-6">
        <div class="text-4xl md:text-5xl font-bold">Another Feature</div>
        <div class="text-xl leading-relaxed text-neutral-700">
          More details about capabilities.
        </div>
      </div>
      <div>
        <img src="{{IMAGE_URL}}" alt="Feature" class="w-full rounded-2xl shadow-xl" />
      </div>
    </div>
  </div>
</div>
\`\`\`

## Pricing Section Patterns

### 5. Three-Tier Pricing Cards

**Use Case**: SaaS pricing, subscription tiers
**Layout**: Three cards with middle one highlighted

\`\`\`html
<div class="py-24 px-4 bg-neutral-50">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16 space-y-4">
      <div class="text-5xl md:text-6xl font-bold">Pricing</div>
      <div class="text-xl text-neutral-600">Choose the perfect plan for your needs</div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Basic Tier -->
      <div class="bg-white rounded-2xl p-8 shadow-lg space-y-6">
        <div>
          <div class="text-2xl font-bold mb-2">Basic</div>
          <div class="text-5xl font-bold">
            $29<span class="text-2xl font-normal text-neutral-600">/mo</span>
          </div>
        </div>
        <div class="space-y-3">
          <div class="text-lg">Feature 1</div>
          <div class="text-lg">Feature 2</div>
          <div class="text-lg">Feature 3</div>
        </div>
        <button class="w-full py-3 px-6 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg font-semibold transition-colors duration-200">
          Get Started
        </button>
      </div>

      <!-- Pro Tier (Highlighted) -->
      <div class="bg-accent-600 text-white rounded-2xl p-8 shadow-2xl transform scale-105 space-y-6">
        <div>
          <div class="text-sm uppercase tracking-wide font-bold mb-2">Most Popular</div>
          <div class="text-2xl font-bold mb-2">Pro</div>
          <div class="text-5xl font-bold">
            $79<span class="text-2xl font-normal opacity-80">/mo</span>
          </div>
        </div>
        <div class="space-y-3">
          <div class="text-lg">Everything in Basic</div>
          <div class="text-lg">Advanced Feature</div>
          <div class="text-lg">Priority Support</div>
        </div>
        <button class="w-full py-3 px-6 bg-white text-accent-600 hover:bg-neutral-50 rounded-lg font-semibold transition-colors duration-200">
          Get Started
        </button>
      </div>

      <!-- Enterprise Tier -->
      <div class="bg-white rounded-2xl p-8 shadow-lg space-y-6">
        <div>
          <div class="text-2xl font-bold mb-2">Enterprise</div>
          <div class="text-5xl font-bold">Custom</div>
        </div>
        <div class="space-y-3">
          <div class="text-lg">Everything in Pro</div>
          <div class="text-lg">Custom Integration</div>
          <div class="text-lg">Dedicated Support</div>
        </div>
        <button class="w-full py-3 px-6 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg font-semibold transition-colors duration-200">
          Contact Sales
        </button>
      </div>
    </div>
  </div>
</div>
\`\`\`

## CTA Section Patterns

### 6. Centered CTA with Background

**Use Case**: Final conversion push, newsletter signup
**Layout**: Centered content on colored/gradient background

\`\`\`html
<div class="py-24 px-4 bg-gradient-to-br from-primary-600 to-accent-600">
  <div class="max-w-4xl mx-auto text-center text-white space-y-8">
    <div class="text-5xl md:text-6xl font-bold leading-tight">
      Ready to Get Started?
    </div>
    <div class="text-2xl leading-relaxed opacity-90">
      Join thousands of satisfied customers today
    </div>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#signup" class="bg-white text-primary-600 hover:bg-neutral-100 text-xl font-bold py-5 px-10 rounded-lg transition-all duration-200 shadow-xl">
        Start Free Trial
      </a>
      <button class="border-2 border-white text-white hover:bg-white hover:text-primary-600 text-xl font-bold py-5 px-10 rounded-lg transition-all duration-200">
        Schedule Demo
      </button>
    </div>
  </div>
</div>
\`\`\`

## Social Proof Patterns

### 7. Logo Strip

**Use Case**: Client logos, partner logos, "As seen in"
**Layout**: Horizontal logo display with even spacing

\`\`\`html
<div class="py-16 px-4 bg-neutral-50">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <div class="text-sm uppercase tracking-wide font-semibold text-neutral-500">
        Trusted by leading companies
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
      <div class="flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-200">
        <img src="{{LOGO_URL}}" alt="Company logo" class="h-12 w-auto grayscale hover:grayscale-0 transition-all duration-200" />
      </div>
      <!-- Repeat for other logos -->
    </div>
  </div>
</div>
\`\`\`

These patterns provide a foundation. Adapt based on brand personality and content needs.
`;

export function getCompositionPatterns(): string {
  return COMPOSITION_PATTERNS;
}
