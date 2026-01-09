/**
 * Industry templates for brand kit generation.
 * These templates provide sensible defaults for different business types.
 */

import type { IndustryTemplate } from "../schemas";

/**
 * Generate a 10-shade neutral scale
 */
export function generateNeutralScale(warm: boolean = true): string[] {
  if (warm) {
    return [
      "#FFFFFF",
      "#FFF8F5",
      "#FDF2EC",
      "#F5E6E0",
      "#E8D5CC",
      "#8B7355",
      "#5C4A3D",
      "#3D3028",
      "#2A211A",
      "#1A1512",
    ];
  } else {
    return [
      "#FFFFFF",
      "#F9FAFB",
      "#F3F4F6",
      "#E5E7EB",
      "#D1D5DB",
      "#9CA3AF",
      "#6B7280",
      "#4B5563",
      "#374151",
      "#1F2937",
    ];
  }
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  restaurant: {
    colorPalettes: [
      {
        name: "burger_joint",
        primary: "#FF6B35",
        secondary: "#D32F2F",
        accent: "#FFB800",
        neutralBase: "warm",
      },
      {
        name: "fine_dining",
        primary: "#1A1A1A",
        secondary: "#6B5344",
        accent: "#B8860B",
        neutralBase: "warm",
      },
      {
        name: "cafe",
        primary: "#8B4513",
        secondary: "#D2691E",
        accent: "#F4A460",
        neutralBase: "warm",
      },
    ],
    typographyOptions: [
      { heading: "Bebas Neue", body: "Inter" },
      { heading: "Oswald", body: "Open Sans" },
      { heading: "Playfair Display", body: "Lato" },
    ],
    imageryDefaults: {
      mood: "bold and appetizing",
      colorTreatment: "vibrant",
      composition: "dynamic",
      photographyVsIllustration: "photography",
    },
    personalityPool: [
      "bold",
      "fresh",
      "friendly",
      "local",
      "authentic",
      "fast",
      "quality",
    ],
  },

  saas: {
    colorPalettes: [
      {
        name: "modern_purple",
        primary: "#6366F1",
        secondary: "#8B5CF6",
        accent: "#EC4899",
        neutralBase: "cool",
      },
      {
        name: "teal_professional",
        primary: "#0F766E",
        secondary: "#0891B2",
        accent: "#F97316",
        neutralBase: "cool",
      },
      {
        name: "blue_trust",
        primary: "#2563EB",
        secondary: "#3B82F6",
        accent: "#10B981",
        neutralBase: "cool",
      },
    ],
    typographyOptions: [
      { heading: "Inter", body: "Inter" },
      { heading: "Space Grotesk", body: "Inter" },
      { heading: "Plus Jakarta Sans", body: "Inter" },
    ],
    imageryDefaults: {
      mood: "modern and professional",
      colorTreatment: "vibrant",
      composition: "clean",
      photographyVsIllustration: "illustration",
    },
    personalityPool: [
      "innovative",
      "trustworthy",
      "data-driven",
      "modern",
      "efficient",
      "scalable",
    ],
  },

  ecommerce: {
    colorPalettes: [
      {
        name: "luxury",
        primary: "#1F2937",
        secondary: "#6B7280",
        accent: "#B91C1C",
        neutralBase: "cool",
      },
      {
        name: "modern_minimal",
        primary: "#18181B",
        secondary: "#52525B",
        accent: "#F59E0B",
        neutralBase: "cool",
      },
      {
        name: "fresh_fashion",
        primary: "#0D9488",
        secondary: "#14B8A6",
        accent: "#FB7185",
        neutralBase: "cool",
      },
    ],
    typographyOptions: [
      { heading: "Playfair Display", body: "Inter" },
      { heading: "Cormorant", body: "Lato" },
      { heading: "DM Sans", body: "DM Sans" },
    ],
    imageryDefaults: {
      mood: "elegant and sophisticated",
      colorTreatment: "muted",
      composition: "clean",
      photographyVsIllustration: "photography",
    },
    personalityPool: [
      "elegant",
      "sophisticated",
      "timeless",
      "premium",
      "curated",
      "exclusive",
    ],
  },

  agency: {
    colorPalettes: [
      {
        name: "creative_bold",
        primary: "#0F766E",
        secondary: "#0891B2",
        accent: "#F97316",
        neutralBase: "cool",
      },
      {
        name: "modern_edge",
        primary: "#7C3AED",
        secondary: "#A855F7",
        accent: "#FBBF24",
        neutralBase: "cool",
      },
      {
        name: "minimal_contrast",
        primary: "#0A0A0A",
        secondary: "#262626",
        accent: "#EF4444",
        neutralBase: "cool",
      },
    ],
    typographyOptions: [
      { heading: "Space Grotesk", body: "Inter" },
      { heading: "Syne", body: "Work Sans" },
      { heading: "Clash Display", body: "Satoshi" },
    ],
    imageryDefaults: {
      mood: "creative and bold",
      colorTreatment: "vibrant",
      composition: "dynamic",
      photographyVsIllustration: "mixed",
    },
    personalityPool: [
      "creative",
      "bold",
      "innovative",
      "collaborative",
      "strategic",
      "results-driven",
    ],
  },

  fitness: {
    colorPalettes: [
      {
        name: "energy",
        primary: "#DC2626",
        secondary: "#F97316",
        accent: "#FBBF24",
        neutralBase: "cool",
      },
      {
        name: "strength",
        primary: "#1E1E1E",
        secondary: "#404040",
        accent: "#22C55E",
        neutralBase: "cool",
      },
      {
        name: "wellness",
        primary: "#059669",
        secondary: "#10B981",
        accent: "#F59E0B",
        neutralBase: "warm",
      },
    ],
    typographyOptions: [
      { heading: "Anton", body: "Inter" },
      { heading: "Bebas Neue", body: "Open Sans" },
      { heading: "Montserrat", body: "Montserrat" },
    ],
    imageryDefaults: {
      mood: "energetic and motivating",
      colorTreatment: "vibrant",
      composition: "dynamic",
      photographyVsIllustration: "photography",
    },
    personalityPool: [
      "energetic",
      "motivating",
      "strong",
      "healthy",
      "achievable",
      "supportive",
    ],
  },

  healthcare: {
    colorPalettes: [
      {
        name: "medical_trust",
        primary: "#0284C7",
        secondary: "#0EA5E9",
        accent: "#10B981",
        neutralBase: "cool",
      },
      {
        name: "wellness_calm",
        primary: "#0D9488",
        secondary: "#14B8A6",
        accent: "#6366F1",
        neutralBase: "cool",
      },
    ],
    typographyOptions: [
      { heading: "Inter", body: "Inter" },
      { heading: "Nunito Sans", body: "Open Sans" },
    ],
    imageryDefaults: {
      mood: "caring and professional",
      colorTreatment: "muted",
      composition: "clean",
      photographyVsIllustration: "photography",
    },
    personalityPool: [
      "caring",
      "professional",
      "trustworthy",
      "compassionate",
      "expert",
      "accessible",
    ],
  },
};

/**
 * Get the template for a specific industry.
 */
export function getTemplateForIndustry(
  industry: string
): IndustryTemplate | undefined {
  return INDUSTRY_TEMPLATES[industry.toLowerCase()];
}

/**
 * Get the default typography scale.
 */
export function getDefaultTypographyScale(): Record<string, string> {
  return {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  };
}

/**
 * Get the default spacing scale.
 */
export function getDefaultSpacingScale(): string[] {
  return [
    "0.25rem",
    "0.5rem",
    "0.75rem",
    "1rem",
    "1.5rem",
    "2rem",
    "3rem",
    "4rem",
    "6rem",
    "8rem",
  ];
}

/**
 * Get default semantic colors.
 */
export function getSemanticColors(): Record<string, string> {
  return {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  };
}
