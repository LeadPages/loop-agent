/**
 * XML-Craft Type Definitions
 *
 * Types for the XML-Craft format - a human-readable XML abstraction over CraftJSON.
 * Supports lossless two-way conversion with CraftJSON.
 */

import type { RGBA, ClickEvent, VisibilitySettings } from "./types";

// =============================================================================
// ELEMENT NAME MAPPINGS
// =============================================================================

/**
 * XML element names to CraftJSON resolvedName mappings
 */
export const ELEMENT_TO_RESOLVED_NAME: Record<string, string> = {
  Page: "Page",
  Container: "Container",
  Text: "Text",
  Button: "Button",
  Image: "Image",
  Video: "Video",
  Form: "Form",
  EmailField: "FormEmailField",
  TextField: "FormTextField",
  PhoneField: "FormPhoneField",
  ConsentField: "FormConsentField",
  DropdownField: "FormDropdownField",
  SelectionField: "FormSelectionField",
  SubmitButton: "FormSubmitButton",
  Countdown: "Countdown",
};

/**
 * CraftJSON resolvedName to XML element name mappings (reverse of above)
 */
export const RESOLVED_NAME_TO_ELEMENT: Record<string, string> = {
  Page: "Page",
  Container: "Container",
  Text: "Text",
  Button: "Button",
  Image: "Image",
  Video: "Video",
  Form: "Form",
  FormEmailField: "EmailField",
  FormTextField: "TextField",
  FormPhoneField: "PhoneField",
  FormConsentField: "ConsentField",
  FormDropdownField: "DropdownField",
  FormSelectionField: "SelectionField",
  FormSubmitButton: "SubmitButton",
  Countdown: "Countdown",
};

/**
 * Elements that can contain children (canvas elements)
 */
export const CANVAS_ELEMENTS = new Set(["Page", "Container"]);

/**
 * Form field elements that can only appear inside Form
 */
export const FORM_FIELD_ELEMENTS = new Set([
  "EmailField",
  "TextField",
  "PhoneField",
  "ConsentField",
  "DropdownField",
  "SelectionField",
  "SubmitButton",
]);

/**
 * Special child elements that are not component nodes
 */
export const SPECIAL_ELEMENTS = new Set([
  "Tablet",
  "Mobile",
  "ClickEvent",
  "ExpireEvent",
  "FollowupAction",
  "Gradient",
  "EmbedCode",
  "Option",
  "p",
  "span",
  "Stop",
]);

// =============================================================================
// ATTRIBUTE CATEGORIES
// =============================================================================

/**
 * TRBL (Top, Right, Bottom, Left) attributes
 */
export const TRBL_ATTRIBUTES = new Set([
  "padding",
  "margin",
  "borderRadius",
]);

/**
 * RGBA color attributes
 */
export const COLOR_ATTRIBUTES = new Set([
  "backgroundColor",
  "color",
  "borderColor",
  "hoverBackgroundColor",
  "fieldLabelColor",
  "fieldInputTextColor",
  "fieldInputBackgroundColor",
  "fieldInputBorderColor",
  "labelTextColor",
  "numberTextColor",
]);

/**
 * Boolean attributes by component
 */
export const BOOLEAN_ATTRIBUTES: Record<string, Set<string>> = {
  common: new Set([
    "hidden",
    "isLocked",
    "positionAnchors",
    "anchorTop",
    "anchorLeft",
    "anchorRight",
    "anchorBottom",
    "appliedGlobalStyle",
    "aspectRatioLock",
  ]),
  Button: new Set(["fillWidth"]),
  Image: new Set(["aspectRatioLock"]),
  Video: new Set(["autoplay", "controls", "loop", "muted"]),
  Form: new Set(["enforceCharacterLimit"]),
  FormField: new Set(["required", "hidden", "showLabel", "showHelpText", "primaryEmailField", "defaultChecked"]),
  Countdown: new Set(["showDays", "showHours", "showMinutes", "showSeconds"]),
};

/**
 * Numeric attributes (always numbers, no units)
 */
export const NUMERIC_ATTRIBUTES = new Set([
  "gap",
  "borderWidth",
  "shadow",
  "opacity",
  "zIndex",
  "minHeight",
  "minWidth",
  "maxWidth",
  "letterSpacing",
  "bgImageScale",
  "bgImageOpacity",
  "characterLimit",
  "flexGrow",
  "placeholderHeight",
  "radius",
]);

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default props for each component type
 */
export const COMPONENT_DEFAULTS: Record<string, Record<string, unknown>> = {
  Page: {
    version: 10,
    fillSpace: "yes",
    padding: [20, 20, 20, 20],
    backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
    color: { r: 0, g: 0, b: 0, a: 1 },
    gap: 10,
    maxWidth: "100%",
    height: "auto",
    bgImageScale: 100,
    bgImageOpacity: 100,
    bgImageMode: "fill",
    bgImagePosition: "center center",
  },
  Container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    height: "auto",
    minHeight: 200,
    minWidth: 100,
    maxWidth: 1200,
    maxWidthUnit: "px",
    padding: [0, 0, 0, 0],
    margin: [0, 0, 0, 0],
    borderRadius: [0, 0, 0, 0],
    borderWidth: 0,
    fillSpace: "no",
    overflow: "visible",
    position: "relative",
    zIndex: 0,
    visibility: { desktop: true, tablet: true, mobile: true },
  },
  Text: {
    textAlign: "left",
    lineHeight: 1.5,
    width: "100%",
    padding: [0, 0, 0, 0],
    margin: [0, 0, 0, 0],
    visibility: { desktop: true, tablet: true, mobile: true },
  },
  Button: {
    text: "Click Me",
    buttonSize: "medium",
    buttonVariant: "primary",
    buttonType: "square",
    fillWidth: false,
    padding: [6, 16, 6, 16],
    margin: [0, 0, 0, 0],
    borderRadius: [0, 0, 0, 0],
    borderWidth: 0,
    color: { r: 255, g: 255, b: 255, a: 1 },
    backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
    fontFamily: "Inter",
    fontSize: "16px",
    fontWeight: "600",
    visibility: { desktop: true, tablet: true, mobile: true },
  },
  Image: {
    src: "",
    alt: "",
    fitType: "cover",
    width: "100%",
    height: "auto",
    opacity: 1,
    padding: [0, 0, 0, 0],
    margin: [0, 0, 0, 0],
    borderRadius: [0, 0, 0, 0],
    visibility: { desktop: true, tablet: true, mobile: true },
  },
  Video: {
    url: "",
    sourceType: "url",
    videoProvider: "youtube",
    autoplay: false,
    controls: true,
    width: "100%",
    height: "auto",
    visibility: { desktop: true, tablet: true, mobile: true },
  },
  Countdown: {
    mode: "standard",
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
    labelDays: "Days",
    labelHours: "Hours",
    labelMinutes: "Minutes",
    labelSeconds: "Seconds",
    visibility: { desktop: true, tablet: true, mobile: true },
  },
  Form: {
    width: "100%",
    padding: [0, 0, 0, 0],
    margin: [0, 0, 0, 0],
    borderRadius: [0, 0, 0, 0],
    borderWidth: 0,
  },
  FormField: {
    required: false,
    hidden: false,
    showLabel: true,
  },
};

// =============================================================================
// PARSED TYPES
// =============================================================================

/**
 * Parsed TRBL value
 */
export type TRBL = [number, number, number, number];

/**
 * Parsed gradient stop
 */
export interface GradientStop {
  position: number;
  color: string; // hex color
}

/**
 * Parsed gradient background
 */
export interface GradientBackground {
  type: "Linear" | "Radial";
  angle?: number;
  stops: GradientStop[];
}

/**
 * Parsed click event from XML
 */
export interface ParsedClickEvent {
  eventType: string;
  eventData: {
    url?: string;
    pageId?: string;
    optionId?: string;
    newTab?: boolean;
    useNofollow?: boolean;
  } | null;
}

/**
 * Parsed expire event from XML
 */
export interface ParsedExpireEvent {
  eventType: string;
  url?: string;
}

/**
 * Parsed followup action from XML
 */
export interface ParsedFollowupAction {
  type: string;
  url?: string;
  message?: string;
}

/**
 * Parsed text span
 */
export interface ParsedTextSpan {
  text: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textTransform?: string;
  letterSpacing?: number;
  color?: RGBA;
}

/**
 * Parsed text paragraph
 */
export interface ParsedTextParagraph {
  type: "paragraph";
  children: ParsedTextSpan[];
}

/**
 * Parsed dropdown/selection option
 */
export interface ParsedOption {
  value: string;
  label: string;
}

// =============================================================================
// CONVERSION CONTEXT
// =============================================================================

/**
 * Context passed through the conversion process
 */
export interface ConversionContext {
  /** Counter for deterministic ID generation */
  nodeCounter: number;
  /** Timestamp for ID uniqueness */
  timestamp: number;
  /** Map of element positions for deterministic IDs */
  elementIndices: Map<string, number>;
}

/**
 * Validation error format
 */
export interface ValidationError {
  code: string;
  message: string;
  element?: string;
  attribute?: string;
  value?: string;
}

// =============================================================================
// UTILITY TYPE GUARDS
// =============================================================================

/**
 * Check if a value is an RGBA object
 */
export function isRGBAObject(value: unknown): value is RGBA {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.r === "number" &&
    typeof obj.g === "number" &&
    typeof obj.b === "number" &&
    typeof obj.a === "number"
  );
}

/**
 * Check if a value is a visibility settings object
 */
export function isVisibilityObject(value: unknown): value is VisibilitySettings {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.desktop === "boolean" &&
    typeof obj.tablet === "boolean" &&
    typeof obj.mobile === "boolean"
  );
}

/**
 * Check if a value is a gradient background
 */
export function isGradient(value: unknown): value is GradientBackground {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    (obj.type === "Linear" || obj.type === "Radial") &&
    Array.isArray(obj.stops)
  );
}

/**
 * Check if a node ID follows the auto-generated pattern
 */
export function isAutoGeneratedId(id: string): boolean {
  // Pattern: {type}_{timestamp}_{index} or 10-char alphanumeric
  const timestampPattern = /^[a-z]+_\d+_\d+$/i;
  const alphanumericPattern = /^[A-Za-z0-9]{10}$/;
  return timestampPattern.test(id) || alphanumericPattern.test(id);
}
