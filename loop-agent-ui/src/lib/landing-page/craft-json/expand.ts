/**
 * CraftJSON Expander Utility
 *
 * Converts simplified AgentPageInput to full CraftJSON format.
 * Handles ID generation, default props, and parent-child relationships.
 */

import type {
  AgentPageInput,
  AgentSection,
  AgentElement,
  AgentButtonElement,
  AgentTextElement,
  AgentImageElement,
  AgentVideoElement,
  AgentCountdownElement,
  AgentFormElement,
  CraftJSON,
  CraftNode,
  PageNode,
  ContainerNode,
  ButtonNode,
  TextNode,
  ImageNode,
  VideoNode,
  CountdownNode,
  FormNode,
  RGBA,
  TextStyleParagraph,
  TextPurpose,
  SectionType,
  SectionLayout,
} from "./types";

/**
 * Generate a unique node ID (10 alphanumeric characters)
 */
function generateNodeId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Default RGBA colors
 */
const DEFAULT_WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 };
const DEFAULT_BLACK: RGBA = { r: 0, g: 0, b: 0, a: 1 };

/**
 * Create default ROOT (Page) node
 *
 * CRITICAL CraftJSON Patterns:
 * - Page padding should be minimal (0) - sections handle their own padding
 * - Always include tablet: {} and mobile: {} even if empty
 * - Use gap: 0 so sections control their own spacing
 */
function createPageNode(childNodeIds: string[]): PageNode {
  return {
    type: { resolvedName: "Page" },
    isCanvas: true,
    props: {
      fillSpace: "yes",
      padding: [0, 0, 0, 0], // Sections handle their own padding
      backgroundColor: DEFAULT_WHITE,
      color: DEFAULT_BLACK,
      radius: 0,
      maxWidth: "100%",
      height: "auto",
      gap: 0, // Sections control their own spacing
      bgImageScale: 100,
      bgImageOpacity: 100,
      bgImageMode: "fill",
      bgImagePosition: "center center",
      bgVideoSourceType: "url",
      bgVideoMode: "fill",
      bgVideoOpacity: 100,
      breakpoint: "desktop",
      // CRITICAL: Always include tablet and mobile even if empty
      tablet: {},
      mobile: {},
    },
    displayName: "Page",
    custom: { displayName: "Landing Page", isLocked: false },
    parent: "", // ROOT has empty parent
    hidden: false,
    nodes: childNodeIds,
    linkedNodes: {},
  };
}

/**
 * Convert SectionLayout to flexDirection
 */
function layoutToFlexDirection(layout?: SectionLayout): "row" | "column" {
  if (!layout) return "column";
  switch (layout) {
    case "row":
    case "text-left-image-right":
    case "text-right-image-left":
    case "three-column-grid":
    case "two-column-grid":
      return "row";
    case "column":
    case "centered":
    case "centered-with-background":
    case "centered-with-form":
    default:
      return "column";
  }
}

/**
 * Get section-specific container styling
 */
function getSectionContainerStyle(sectionType: SectionType, layout?: SectionLayout): {
  flexDirection: "row" | "column";
  alignItems: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  justifyContent: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
  gap: number;
  padding: [number, number, number, number];
  minHeight: number;
  maxWidth: number;
} {
  const flexDirection = layoutToFlexDirection(layout);

  switch (sectionType) {
    case "header":
      return {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: [16, 40, 16, 40],
        minHeight: 60,
        maxWidth: 1200,
      };
    case "hero":
      return {
        flexDirection: flexDirection,
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        padding: [80, 40, 80, 40],
        minHeight: 400,
        maxWidth: 1200,
      };
    case "features":
      return {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: [60, 40, 60, 40],
        minHeight: 200,
        maxWidth: 1200,
      };
    case "testimonials":
      return {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: [60, 40, 60, 40],
        minHeight: 200,
        maxWidth: 900,
      };
    case "cta":
      return {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: [60, 40, 60, 40],
        minHeight: 200,
        maxWidth: 800,
      };
    case "faq":
      return {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 16,
        padding: [60, 40, 60, 40],
        minHeight: 200,
        maxWidth: 800,
      };
    case "about":
    case "contact":
    case "stats":
    case "pricing":
    default:
      return {
        flexDirection: flexDirection,
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: [60, 40, 60, 40],
        minHeight: 200,
        maxWidth: 1200,
      };
  }
}

/**
 * Create default Container node with section-specific styling
 *
 * CRITICAL CraftJSON Patterns:
 * - Containers MUST have width: "100%" and proper flexbox settings
 * - Feature grids need fillSpace: "yes" and flexBasis: "0%" for equal widths
 * - Always include visibility object with all breakpoints
 * - Always include tablet: {} and mobile: {} even if empty
 * - minWidth: 100 is required to prevent collapse
 */
function createContainerNode(
  parentId: string,
  childNodeIds: string[],
  options?: {
    sectionType?: SectionType;
    layout?: SectionLayout;
    backgroundColor?: RGBA;
    isInnerContainer?: boolean;
    isFeatureCard?: boolean; // For equal-width feature grid items
  }
): ContainerNode {
  const sectionStyle = options?.sectionType
    ? getSectionContainerStyle(options.sectionType, options.layout)
    : {
        flexDirection: layoutToFlexDirection(options?.layout),
        alignItems: "center" as const,
        justifyContent: "center" as const,
        gap: 24,
        padding: [60, 40, 60, 40] as [number, number, number, number],
        minHeight: 100,
        maxWidth: 1200,
      };

  // Inner containers (like hero columns) have different styling
  const isInner = options?.isInnerContainer;

  // Feature cards need special styling for equal widths in grid
  const isFeatureCard = options?.isFeatureCard;

  // CRITICAL: Determine flex properties for equal-width grids
  let fillSpace: "yes" | "no" = "no";
  let flexBasis = "100%";
  let flexGrow = 0;

  if (isInner) {
    // Two-column hero layout - each column takes 50%
    fillSpace = "yes";
    flexBasis = "50%";
    flexGrow = 1;
  } else if (isFeatureCard) {
    // CRITICAL: Feature cards need flex: 1 equivalent for equal widths
    fillSpace = "yes";
    flexBasis = "0%"; // 0% basis with flex-grow: 1 = equal widths
    flexGrow = 1;
  }

  return {
    type: { resolvedName: "Container" },
    isCanvas: true,
    props: {
      flexDirection: isInner ? layoutToFlexDirection(options?.layout) : sectionStyle.flexDirection,
      alignItems: isInner ? "flex-start" : sectionStyle.alignItems,
      justifyContent: isInner ? "center" : sectionStyle.justifyContent,
      gap: isInner ? 16 : sectionStyle.gap,
      width: "100%", // CRITICAL: Always 100% width
      height: "auto",
      minHeight: isInner ? 0 : sectionStyle.minHeight,
      minWidth: 100, // CRITICAL: Prevent container collapse
      maxWidthUnit: "px",
      maxWidth: isInner ? 9999 : sectionStyle.maxWidth,
      padding: isInner ? [0, 0, 0, 0] : sectionStyle.padding,
      margin: [0, 0, 0, 0],
      borderWidth: 0,
      borderRadius: [0, 0, 0, 0],
      shadow: 0,
      opacity: 1,
      overflow: "visible",
      bgImageScale: 100,
      bgImageOpacity: 100,
      bgImageMode: "fill",
      bgImagePosition: "center center",
      position: "relative",
      zIndex: 0,
      fillSpace: fillSpace,
      flexBasis: flexBasis,
      flexGrow: flexGrow,
      placeholderHeight: 512,
      positionAnchorsState: {
        enabled: false,
        enableTop: false,
        enableLeft: false,
        enableRight: false,
        enableBottom: false,
      },
      // CRITICAL: Visibility format with all three breakpoints
      visibility: { desktop: true, tablet: true, mobile: true },
      aspectRatioLock: false,
      // CRITICAL: Always include tablet and mobile even if empty
      tablet: isInner ? {} : { padding: [40, 30, 40, 30] },
      mobile: isInner || isFeatureCard
        ? { width: "100%", flexBasis: "100%" }
        : { width: "100%", padding: [30, 20, 30, 20], flexDirection: "column" },
      backgroundColor: options?.backgroundColor,
    },
    displayName: "Container",
    custom: { displayName: options?.sectionType ? `${options.sectionType.charAt(0).toUpperCase() + options.sectionType.slice(1)} Section` : "Container", isLocked: false },
    parent: parentId,
    hidden: false,
    nodes: childNodeIds,
    linkedNodes: {},
  };
}

/**
 * Create Button node from agent input
 *
 * CRITICAL CraftJSON Patterns:
 * - Use appliedGlobalStyle: true for consistent button styling
 * - Always include visibility with all breakpoints
 * - Always include tablet: {} and mobile: {} even if empty
 */
function createButtonNode(parentId: string, element: AgentButtonElement): ButtonNode {
  return {
    type: { resolvedName: "Button" },
    isCanvas: false,
    props: {
      fillWidth: false,
      positionAnchorsState: {
        enabled: false,
        enableTop: false,
        enableLeft: false,
        enableRight: false,
        enableBottom: false,
      },
      // CRITICAL: Visibility format with all three breakpoints
      visibility: { desktop: true, tablet: true, mobile: true },
      buttonSize: "medium",
      buttonVariant: "primary",
      padding: [14, 28, 14, 28],
      margin: [0, 0, 0, 0],
      borderRadius: [4, 4, 4, 4],
      position: "relative",
      top: "0px",
      left: "0px",
      right: "",
      bottom: "",
      borderWidth: 0,
      textAlign: "center",
      text: element.text,
      letterSpacing: 0,
      fontFamily: "Inter",
      fontWeight: "600",
      fontSize: "16px",
      fontStyle: "normal",
      color: element.color || DEFAULT_WHITE,
      backgroundColor: element.backgroundColor || DEFAULT_BLACK,
      // Use global styles for consistent button styling
      appliedGlobalStyle: true,
      buttonType: "square",
      minWidth: "64px",
      minHeight: "32px",
      width: "auto",
      flexBasis: "auto",
      fillSpace: "no",
      height: "auto",
      zIndex: 0,
      clickEvent: {
        eventType: element.href ? "open-external-link" : "nolink",
        eventData: element.href ? { url: element.href, newTab: true } : null,
      },
      // CRITICAL: Always include tablet and mobile even if empty
      tablet: {},
      mobile: {},
    },
    displayName: "Button",
    custom: { displayName: "Button", isLocked: false },
    parent: parentId,
    hidden: false,
    nodes: [],
    linkedNodes: {},
  };
}

/**
 * Typography hierarchy based on text purpose
 */
function getTypographyForPurpose(purpose?: TextPurpose): { fontSize: string; fontWeight: string; fontStyle?: string } {
  switch (purpose) {
    case "headline":
      return { fontSize: "48px", fontWeight: "700" };
    case "section-heading":
      return { fontSize: "36px", fontWeight: "600" };
    case "subheadline":
      return { fontSize: "22px", fontWeight: "400" };
    case "logo":
      return { fontSize: "24px", fontWeight: "700" };
    case "feature-title":
      return { fontSize: "20px", fontWeight: "600" };
    case "feature-description":
      return { fontSize: "16px", fontWeight: "400" };
    case "testimonial-quote":
      return { fontSize: "20px", fontWeight: "400", fontStyle: "italic" };
    case "testimonial-author":
      return { fontSize: "16px", fontWeight: "600" };
    case "stat-number":
      return { fontSize: "48px", fontWeight: "700" };
    case "stat-label":
      return { fontSize: "14px", fontWeight: "500" };
    case "faq-question":
      return { fontSize: "18px", fontWeight: "600" };
    case "faq-answer":
      return { fontSize: "16px", fontWeight: "400" };
    case "body-text":
    default:
      return { fontSize: "18px", fontWeight: "400" };
  }
}

/**
 * Determine default text alignment based on section type
 */
function getDefaultTextAlign(sectionType?: SectionType, purpose?: TextPurpose): "left" | "center" | "right" {
  // Headlines and section headings are typically centered in most sections
  if (purpose === "headline" || purpose === "section-heading" || purpose === "subheadline") {
    // Hero content in two-column layouts should be left-aligned
    if (sectionType === "hero") {
      return "left";
    }
    return "center";
  }

  // Centered sections default to center alignment
  if (sectionType === "features" || sectionType === "cta" || sectionType === "testimonials") {
    return "center";
  }

  // Header and hero default to left
  return "left";
}

/**
 * Map text purpose to global style variant
 */
function getGlobalStyleVariant(purpose?: TextPurpose): string {
  switch (purpose) {
    case "headline":
      return "heading.h1";
    case "section-heading":
      return "heading.h2";
    case "subheadline":
      return "body.large";
    case "logo":
      return "heading.h3";
    case "feature-title":
      return "heading.h3";
    case "feature-description":
      return "body.medium";
    case "testimonial-quote":
      return "body.large";
    case "testimonial-author":
      return "body.small";
    case "stat-number":
      return "heading.h1";
    case "stat-label":
      return "body.small";
    case "faq-question":
      return "heading.h3";
    case "faq-answer":
      return "body.medium";
    case "body-text":
    default:
      return "body.medium";
  }
}

/**
 * Create Text node from agent input
 *
 * CRITICAL CraftJSON Pattern:
 * - Text color on dark backgrounds MUST be in the textStyles children array
 * - Always include textTransform: "none" in Slate AST
 * - Use appliedGlobalStyle: true with selectedStyleVariant for consistent typography
 */
function createTextNode(parentId: string, element: AgentTextElement, sectionType?: SectionType): TextNode {
  // Get typography based on purpose, with explicit overrides taking precedence
  const typography = getTypographyForPurpose(element.purpose);

  // Determine text alignment: explicit > section-based default
  const textAlign = element.textAlign || getDefaultTextAlign(sectionType, element.purpose);

  // CRITICAL: Color MUST be in the textStyles children for proper rendering
  // This is especially important for text on dark backgrounds
  const textColor = element.color || DEFAULT_BLACK;

  const textStyle: TextStyleParagraph = {
    type: "paragraph",
    children: [
      {
        text: element.content,
        fontWeight: element.fontWeight || typography.fontWeight,
        fontFamily: "Inter",
        fontStyle: typography.fontStyle || "normal",
        textTransform: "none", // CRITICAL: Always include textTransform
        letterSpacing: 0,
        fontSize: element.fontSize || typography.fontSize,
        color: textColor, // CRITICAL: Color in children for dark backgrounds
      },
    ],
  };

  return {
    type: { resolvedName: "Text" },
    isCanvas: false,
    props: {
      textStyles: [textStyle],
      textAlign: textAlign,
      lineHeight: 1.5,
      width: "100%",
      height: "auto",
      maxWidth: 1200,
      maxWidthUnit: "px",
      padding: [0, 0, 0, 0],
      margin: [0, 0, 0, 0],
      borderRadius: [0, 0, 0, 0],
      shadow: 0,
      position: "relative",
      zIndex: 0,
      fillSpace: "yes",
      flexBasis: "100%",
      // Use global styles for consistent typography
      appliedGlobalStyle: true,
      selectedStyleVariant: getGlobalStyleVariant(element.purpose),
      htmlContent: "",
      positionAnchorsState: {
        enabled: false,
        enableTop: false,
        enableLeft: false,
        enableRight: false,
        enableBottom: false,
      },
      visibility: { desktop: true, tablet: true, mobile: true },
      tablet: {},
      mobile: {},
    },
    displayName: "Text",
    custom: { displayName: element.purpose || "Text", isLocked: false },
    parent: parentId,
    hidden: false,
    nodes: [],
    linkedNodes: {},
  };
}

/**
 * Create Image node from agent input
 *
 * CRITICAL CraftJSON Patterns:
 * - Always include visibility with all breakpoints
 * - Always include tablet: {} and mobile: {} with responsive overrides
 * - Use fillSpace and flexBasis for proper sizing in layouts
 */
function createImageNode(parentId: string, element: AgentImageElement): ImageNode {
  return {
    type: { resolvedName: "Image" },
    isCanvas: false,
    props: {
      src: element.src,
      alt: element.alt,
      width: element.width || "100%",
      height: element.height || "400px",
      fitType: "cover",
      minWidth: 0,
      minHeight: 0,
      maxWidth: 1200,
      maxWidthUnit: "px",
      padding: [0, 0, 0, 0],
      margin: [0, 0, 0, 0],
      borderRadius: [0, 0, 0, 0],
      borderWidth: 0,
      opacity: 1,
      position: "relative",
      top: "0px",
      left: "0px",
      zIndex: 0,
      fillSpace: "yes",
      flexBasis: "100%",
      flexGrow: 0,
      aspectRatioLock: false,
      backgroundSize: "100%",
      backgroundPosition: "left top",
      objectPosition: "center center",
      positionAnchorsState: {
        enabled: false,
        enableTop: false,
        enableLeft: false,
        enableRight: false,
        enableBottom: false,
      },
      // CRITICAL: Visibility format with all three breakpoints
      visibility: { desktop: true, tablet: true, mobile: true },
      // CRITICAL: Always include tablet and mobile with responsive overrides
      tablet: {},
      mobile: {
        width: "100%",
        fillSpace: "no",
        flexBasis: "100%",
      },
    },
    displayName: "Image",
    custom: { displayName: "Image", isLocked: false },
    parent: parentId,
    hidden: false,
    nodes: [],
    linkedNodes: {},
  };
}

/**
 * Create Video node from agent input
 *
 * CRITICAL CraftJSON Patterns:
 * - Always include visibility with all breakpoints
 * - Always include tablet: {} and mobile: {} with responsive overrides
 */
function createVideoNode(parentId: string, element: AgentVideoElement): VideoNode {
  return {
    type: { resolvedName: "Video" },
    isCanvas: false,
    props: {
      url: element.url,
      sourceType: "url",
      embedCode: "",
      videoProvider: element.provider || "youtube",
      autoplay: false,
      controls: true,
      loop: false,
      muted: false,
      fitType: "fill",
      opacity: 1,
      width: "100%",
      height: "315px",
      minWidth: 0,
      minHeight: 0,
      aspectRatioLock: true,
      padding: [0, 0, 0, 0],
      margin: [0, 0, 0, 0],
      borderRadius: [0, 0, 0, 0],
      borderWidth: 0,
      position: "relative",
      top: "0px",
      left: "0px",
      zIndex: 0,
      fillSpace: "yes",
      flexBasis: "100%",
      flexGrow: 0,
      positionAnchorsState: {
        enabled: false,
        enableTop: false,
        enableLeft: false,
        enableRight: false,
        enableBottom: false,
      },
      // CRITICAL: Visibility format with all three breakpoints
      visibility: { desktop: true, tablet: true, mobile: true },
      // CRITICAL: Always include tablet and mobile with responsive overrides
      tablet: {},
      mobile: {
        width: "100%",
        fillSpace: "no",
        flexBasis: "100%",
      },
    },
    displayName: "Video",
    custom: { displayName: "Video", isLocked: false },
    parent: parentId,
    hidden: false,
    nodes: [],
    linkedNodes: {},
  };
}

/**
 * Create Countdown node from agent input
 *
 * CRITICAL CraftJSON Patterns:
 * - Always include visibility with all breakpoints
 * - Always include tablet: {} and mobile: {} even if empty
 */
function createCountdownNode(parentId: string, element: AgentCountdownElement): CountdownNode {
  return {
    type: { resolvedName: "Countdown" },
    isCanvas: false,
    props: {
      mode: "standard",
      dateTime: element.dateTime,
      type: "default",
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      labelDays: "Days",
      labelHours: "Hours",
      labelMinutes: "Minutes",
      labelSeconds: "Seconds",
      labelFontFamily: "Inter",
      labelFontWeight: "400",
      labelFontStyle: "normal",
      labelFontSize: "12px",
      labelTextColor: { r: 156, g: 163, b: 175, a: 1 },
      labelLetterSpacing: 0.05,
      numberFontFamily: "Inter",
      numberFontWeight: "700",
      numberFontStyle: "normal",
      numberFontSize: "32px",
      numberTextColor: { r: 255, g: 255, b: 255, a: 1 },
      numberLetterSpacing: 0,
      backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
      gap: 16,
      width: "100%",
      height: "auto",
      minHeight: 64,
      padding: [16, 24, 16, 24],
      margin: [0, 0, 0, 0],
      borderRadius: [8, 8, 8, 8],
      borderWidth: 0,
      position: "relative",
      zIndex: 0,
      fillSpace: "yes",
      flexBasis: "100%",
      clickEvent: { eventType: "nolink", eventData: null },
      expireEvent: { eventType: "stay-on-page", eventData: null },
      positionAnchorsState: {
        enabled: false,
        enableTop: false,
        enableLeft: false,
        enableRight: false,
        enableBottom: false,
      },
      // CRITICAL: Visibility format with all three breakpoints
      visibility: { desktop: true, tablet: true, mobile: true },
      // CRITICAL: Always include tablet and mobile even if empty
      tablet: {},
      mobile: {},
    },
    displayName: "Countdown",
    custom: { displayName: "Countdown", isLocked: false },
    parent: parentId,
    hidden: false,
    nodes: [],
    linkedNodes: {},
  };
}

/**
 * Create Form node from agent input with child fields
 *
 * CRITICAL CraftJSON Patterns:
 * - Always include visibility with all breakpoints
 * - Always include tablet: {} and mobile: {} even if empty
 * - Form requires an id property for proper submission handling
 */
function createFormNodes(
  parentId: string,
  element: AgentFormElement,
  nodes: Record<string, CraftNode>
): { formId: string; childIds: string[] } {
  const formId = generateNodeId();
  const childIds: string[] = [];

  // Create form field nodes
  for (const field of element.fields) {
    const fieldId = generateNodeId();
    childIds.push(fieldId);

    const isEmailField = field.type === "email";
    const fieldNode: CraftNode = {
      type: { resolvedName: isEmailField ? "FormEmailField" : "FormTextField" },
      isCanvas: false,
      props: {
        id: fieldId,
        inputType: isEmailField ? "email" : "text",
        label: field.label || (isEmailField ? "Email" : "Name"),
        showLabel: false,
        placeholder: field.placeholder || (isEmailField ? "Enter your email" : "Enter your name"),
        required: true,
        hidden: false,
        helpText: "",
        showHelpText: false,
        ...(isEmailField ? { primaryEmailField: true } : { enforceCharacterLimit: false }),
        positionAnchorsState: {
          enabled: false,
          enableTop: false,
          enableLeft: false,
          enableRight: false,
          enableBottom: false,
        },
        // CRITICAL: Visibility format with all three breakpoints
        visibility: { desktop: true, tablet: true, mobile: true },
        // CRITICAL: Always include tablet and mobile even if empty
        tablet: {},
        mobile: {},
      },
      displayName: isEmailField ? "FormEmailField" : "FormTextField",
      custom: { displayName: isEmailField ? "Email" : "Name", isLocked: false },
      parent: formId,
      hidden: false,
      nodes: [],
      linkedNodes: {},
    };
    nodes[fieldId] = fieldNode;
  }

  // Create submit button
  const submitId = generateNodeId();
  childIds.push(submitId);

  const submitNode: CraftNode = {
    type: { resolvedName: "FormSubmitButton" },
    isCanvas: false,
    props: {
      text: element.submitText,
      variant: "primary",
      size: "medium",
      fullWidth: true,
      backgroundColor: element.submitBackgroundColor || DEFAULT_BLACK,
      color: DEFAULT_WHITE,
      fontFamily: "Inter",
      fontWeight: "600",
      fontSize: "16px",
      width: "100%",
      height: "auto",
      padding: [12, 24, 12, 24],
      margin: [0, 0, 0, 0],
      borderRadius: [4, 4, 4, 4],
      positionAnchorsState: {
        enabled: false,
        enableTop: false,
        enableLeft: false,
        enableRight: false,
        enableBottom: false,
      },
      // CRITICAL: Visibility format with all three breakpoints
      visibility: { desktop: true, tablet: true, mobile: true },
      // CRITICAL: Always include tablet and mobile even if empty
      tablet: {},
      mobile: {},
    },
    displayName: "FormSubmitButton",
    custom: { displayName: "Submit", isLocked: false },
    parent: formId,
    hidden: false,
    nodes: [],
    linkedNodes: {},
  };
  nodes[submitId] = submitNode;

  // Create form container
  const formNode: FormNode = {
    type: { resolvedName: "Form" },
    isCanvas: true,
    props: {
      id: formId,
      name: "Contact Form",
      followupAction: { type: "remain" },
      width: "100%",
      height: "auto",
      minWidth: 100,
      minHeight: 64,
      maxWidth: 500,
      maxWidthUnit: "px",
      padding: [16, 16, 16, 16],
      margin: [0, 0, 0, 0],
      borderRadius: [8, 8, 8, 8],
      borderWidth: 1,
      borderColor: { r: 229, g: 231, b: 235, a: 1 },
      backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
      position: "relative",
      zIndex: 0,
      fillSpace: "yes",
      flexBasis: "100%",
      fieldWidth: "100%",
      fieldMaxWidth: "100%",
      fieldMinWidth: "0px",
      fieldMargin: [0, 0, 16, 0],
      fieldBorderRadius: [6, 6, 6, 6],
      fieldInputPadding: [10, 12, 10, 12],
      fieldLabelFontFamily: "Inter",
      fieldLabelFontSize: "10px",
      fieldLabelFontWeight: 500,
      fieldLabelColor: { r: 87, g: 95, b: 106, a: 1 },
      fieldInputFontFamily: "Inter",
      fieldInputFontSize: "14px",
      fieldInputFontWeight: 500,
      fieldInputTextColor: { r: 107, g: 114, b: 128, a: 1 },
      fieldInputBackgroundColor: { r: 255, g: 255, b: 255, a: 1 },
      fieldInputBorderColor: { r: 209, g: 213, b: 219, a: 1 },
      fieldInputBorderWidth: 1,
      positionAnchorsState: {
        enabled: false,
        enableTop: false,
        enableLeft: false,
        enableRight: false,
        enableBottom: false,
      },
      // CRITICAL: Visibility format with all three breakpoints
      visibility: { desktop: true, tablet: true, mobile: true },
      aspectRatioLock: false,
      // CRITICAL: Always include tablet and mobile even if empty
      tablet: {},
      mobile: {},
    },
    displayName: "Form",
    custom: { displayName: "Form", isLocked: false },
    parent: parentId,
    hidden: false,
    nodes: childIds,
    linkedNodes: {},
  };
  nodes[formId] = formNode;

  return { formId, childIds };
}

/**
 * Create element node based on type
 */
function createElementNode(
  parentId: string,
  element: AgentElement,
  nodes: Record<string, CraftNode>,
  sectionType?: SectionType
): string {
  const nodeId = generateNodeId();

  switch (element.type) {
    case "button":
      nodes[nodeId] = createButtonNode(parentId, element);
      return nodeId;

    case "text":
      nodes[nodeId] = createTextNode(parentId, element, sectionType);
      return nodeId;

    case "image":
      nodes[nodeId] = createImageNode(parentId, element);
      return nodeId;

    case "video":
      nodes[nodeId] = createVideoNode(parentId, element);
      return nodeId;

    case "countdown":
      nodes[nodeId] = createCountdownNode(parentId, element);
      return nodeId;

    case "form": {
      const { formId } = createFormNodes(parentId, element, nodes);
      return formId;
    }

    default:
      throw new Error(`Unknown element type: ${(element as AgentElement).type}`);
  }
}

/**
 * Check if hero section has a two-column layout
 */
function isTwoColumnHeroLayout(layout?: string): boolean {
  return layout === "row" ||
    layout === "text-left-image-right" ||
    layout === "text-right-image-left";
}

/**
 * Separate hero elements into content (text/button) and media (image/video)
 */
function separateHeroElements(elements: AgentElement[]): { content: AgentElement[]; media: AgentElement[] } {
  const content: AgentElement[] = [];
  const media: AgentElement[] = [];

  for (const element of elements) {
    if (element.type === "image" || element.type === "video") {
      media.push(element);
    } else {
      content.push(element);
    }
  }

  return { content, media };
}

/**
 * Create a two-column hero layout with nested containers
 */
function createTwoColumnHeroSection(
  section: AgentSection,
  nodes: Record<string, CraftNode>
): string {
  const sectionId = generateNodeId();
  const { content, media } = separateHeroElements(section.elements);

  // Determine order: text-left or text-right
  const isTextLeft = section.layout !== "text-right-image-left";

  // Create content column (text elements + buttons)
  const contentColumnId = generateNodeId();
  const contentElementIds: string[] = [];
  for (const element of content) {
    const elementId = createElementNode(contentColumnId, element, nodes, "hero");
    contentElementIds.push(elementId);
  }
  nodes[contentColumnId] = createContainerNode(sectionId, contentElementIds, {
    layout: "column",
    isInnerContainer: true,
  });

  // Create media column (images/videos)
  const mediaColumnId = generateNodeId();
  const mediaElementIds: string[] = [];
  for (const element of media) {
    const elementId = createElementNode(mediaColumnId, element, nodes, "hero");
    mediaElementIds.push(elementId);
  }
  nodes[mediaColumnId] = createContainerNode(sectionId, mediaElementIds, {
    layout: "column",
    isInnerContainer: true,
  });

  // Order columns based on layout
  const columnIds = isTextLeft
    ? [contentColumnId, mediaColumnId]
    : [mediaColumnId, contentColumnId];

  // Create section container with row layout
  nodes[sectionId] = createContainerNode("ROOT", columnIds, {
    sectionType: "hero",
    layout: "row",
    backgroundColor: section.backgroundColor,
  });

  return sectionId;
}

/**
 * Expand simplified AgentPageInput to full CraftJSON
 */
export function expandToCraftJSON(input: AgentPageInput): CraftJSON {
  const nodes: Record<string, CraftNode> = {};
  const rootChildIds: string[] = [];

  // Process each section
  for (const section of input.sections) {
    const sectionType = section.sectionType;

    // Special handling for two-column hero layouts
    if (sectionType === "hero" && isTwoColumnHeroLayout(section.layout)) {
      const heroSectionId = createTwoColumnHeroSection(section, nodes);
      rootChildIds.push(heroSectionId);
      continue;
    }

    // All sections get a container wrapper for proper styling
    const containerId = generateNodeId();
    rootChildIds.push(containerId);

    // Create element nodes as children of the container
    const elementIds: string[] = [];
    for (const element of section.elements) {
      const elementId = createElementNode(containerId, element, nodes, sectionType);
      elementIds.push(elementId);
    }

    // Create container node for this section with section-specific styling
    nodes[containerId] = createContainerNode("ROOT", elementIds, {
      sectionType: sectionType,
      layout: section.layout,
      backgroundColor: section.backgroundColor,
    });
  }

  // Create ROOT page node
  const rootNode = createPageNode(rootChildIds);

  // Assemble final CraftJSON
  return {
    ROOT: rootNode,
    ...nodes,
    version: 10,
  } as CraftJSON;
}

/**
 * Valid section types
 */
const VALID_SECTION_TYPES: SectionType[] = [
  "header", "hero", "features", "cta", "testimonials",
  "about", "faq", "contact", "stats", "pricing"
];

/**
 * Validate AgentPageInput structure
 */
export function validateAgentInput(input: unknown): input is AgentPageInput {
  if (!input || typeof input !== "object") {
    return false;
  }

  const obj = input as Record<string, unknown>;

  if (!Array.isArray(obj.sections)) {
    return false;
  }

  for (const section of obj.sections) {
    if (!section || typeof section !== "object") {
      return false;
    }

    const sec = section as Record<string, unknown>;

    // Validate sectionType exists and is valid
    if (!sec.sectionType || typeof sec.sectionType !== "string") {
      console.warn("[validateAgentInput] Section missing sectionType:", sec);
      return false;
    }
    if (!VALID_SECTION_TYPES.includes(sec.sectionType as SectionType)) {
      console.warn("[validateAgentInput] Invalid sectionType:", sec.sectionType);
      return false;
    }

    if (!Array.isArray(sec.elements)) {
      return false;
    }

    for (const element of sec.elements) {
      if (!element || typeof element !== "object") {
        return false;
      }

      const el = element as Record<string, unknown>;

      if (!el.type || typeof el.type !== "string") {
        return false;
      }

      const validTypes = ["button", "text", "image", "video", "countdown", "form"];
      if (!validTypes.includes(el.type as string)) {
        return false;
      }
    }
  }

  return true;
}
