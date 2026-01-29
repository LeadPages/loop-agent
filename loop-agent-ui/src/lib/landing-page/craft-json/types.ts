/**
 * CraftJSON Type Definitions
 *
 * CraftJSON is the structured JSON format used by the Leadpages Builder.
 * This file defines the TypeScript types for both the full CraftJSON structure
 * and the simplified AgentPageInput that the AI agent generates.
 */

// RGBA color format used in CraftJSON
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Node type resolver
export interface NodeType {
  resolvedName:
    | "Page"
    | "Container"
    | "Button"
    | "Text"
    | "Image"
    | "Video"
    | "Countdown"
    | "Form"
    | "FormEmailField"
    | "FormTextField"
    | "FormSubmitButton";
}

// Text style child element
export interface TextStyleChild {
  text: string;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: string;
  textTransform?: string;
  letterSpacing?: number;
  fontSize?: string;
  color?: RGBA;
}

// Text style paragraph
export interface TextStyleParagraph {
  type: "paragraph";
  children: TextStyleChild[];
}

// Position anchors state
export interface PositionAnchorsState {
  enabled: boolean;
  enableTop: boolean;
  enableLeft: boolean;
  enableRight: boolean;
  enableBottom: boolean;
}

// Visibility settings
export interface VisibilitySettings {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
}

// Click event with proper event data structure
export interface ClickEvent {
  eventType: "nolink" | "open-external-link" | "open-internal-page" | "scroll-to-element" | "download-file" | "url" | "email" | "phone" | "anchor";
  eventData: null | string | { url: string; newTab?: boolean } | { pageId: string } | { elementId: string } | { fileUrl: string };
}

// Responsive overrides
export interface ResponsiveOverrides {
  padding?: [number, number, number, number];
  width?: string;
  flexDirection?: "row" | "column";
  fontSize?: string;
  [key: string]: unknown;
}

// Base node properties shared by all nodes
export interface BaseNodeProps {
  positionAnchorsState?: PositionAnchorsState;
  visibility?: VisibilitySettings;
  tablet?: ResponsiveOverrides;
  mobile?: ResponsiveOverrides;
}

// Page node props
export interface PageProps extends BaseNodeProps {
  fillSpace: "yes" | "no";
  padding: [number, number, number, number];
  backgroundColor: RGBA;
  color?: RGBA; // Default text color for the page
  radius: number;
  maxWidth: string;
  height: string;
  gap: number;
  bgImageScale: number;
  bgImageOpacity: number;
  bgImageMode: "fill" | "cover" | "contain";
  bgImagePosition: string;
  bgVideoSourceType?: "url" | "upload";
  bgVideoMode?: "fill" | "cover" | "contain";
  bgVideoOpacity?: number;
  breakpoint: "desktop" | "tablet" | "mobile";
}

// Container node props
export interface ContainerProps extends BaseNodeProps {
  flexDirection: "row" | "column";
  alignItems: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  justifyContent: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
  gap: number;
  width: string;
  height: string;
  minHeight: number;
  minWidth: number;
  maxWidthUnit: "px" | "%";
  maxWidth: number;
  padding: [number, number, number, number];
  margin: [number, number, number, number];
  borderWidth: number;
  borderRadius: [number, number, number, number];
  shadow: number;
  opacity: number;
  overflow: "visible" | "hidden" | "scroll" | "auto";
  bgImageScale: number;
  bgImageOpacity: number;
  bgImageMode: "fill" | "cover" | "contain";
  bgImagePosition: string;
  position: "relative" | "absolute" | "fixed";
  zIndex: number;
  fillSpace: "yes" | "no";
  flexBasis: string;
  flexGrow: number;
  placeholderHeight: number;
  aspectRatioLock: boolean;
  backgroundColor?: RGBA;
}

// Button node props
export interface ButtonProps extends BaseNodeProps {
  fillWidth: boolean;
  buttonSize: "small" | "medium" | "large";
  buttonVariant: "primary" | "secondary" | "outline";
  padding: [number, number, number, number];
  margin: [number, number, number, number];
  borderRadius: [number, number, number, number];
  position: "relative" | "absolute";
  top: string;
  left: string;
  right: string;
  bottom: string;
  borderWidth: number;
  textAlign: "left" | "center" | "right";
  text: string;
  letterSpacing: number;
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  fontStyle: string;
  color: RGBA;
  backgroundColor: RGBA;
  appliedGlobalStyle: boolean;
  buttonType: "square" | "rounded" | "pill";
  minWidth: string;
  minHeight: string;
  width: string;
  flexBasis: string;
  fillSpace: "yes" | "no";
  height: string;
  zIndex: number;
  clickEvent: ClickEvent;
}

// Text node props
export interface TextProps extends BaseNodeProps {
  textStyles: TextStyleParagraph[];
  textAlign: "left" | "center" | "right";
  lineHeight?: number;
  width?: string;
  height?: string;
  maxWidth?: number;
  maxWidthUnit?: "px" | "%";
  margin?: [number, number, number, number];
  padding?: [number, number, number, number];
  borderRadius?: [number, number, number, number];
  shadow?: number;
  position?: "relative" | "absolute";
  zIndex?: number;
  fillSpace?: "yes" | "no";
  flexBasis?: string;
  // Global style support for consistent typography
  appliedGlobalStyle?: boolean;
  selectedStyleVariant?: string;
  htmlContent?: string;
}

// Image node props
export interface ImageProps extends BaseNodeProps {
  src: string;
  alt: string;
  width: string;
  height: string;
  fitType: "cover" | "fill" | "contain" | "none" | "scale-down" | "tile";
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxWidthUnit?: "px" | "%";
  padding?: [number, number, number, number];
  margin?: [number, number, number, number];
  borderRadius?: [number, number, number, number];
  borderWidth?: number;
  opacity?: number;
  position?: "relative" | "absolute";
  top?: string;
  left?: string;
  zIndex?: number;
  fillSpace?: "yes" | "no";
  flexBasis?: string;
  flexGrow?: number;
  aspectRatioLock?: boolean;
  backgroundSize?: string;
  backgroundPosition?: string;
  objectPosition?: string;
}

// Video node props
export interface VideoProps extends BaseNodeProps {
  url: string;
  sourceType: "url" | "embed";
  embedCode?: string;
  videoProvider: "youtube" | "vimeo" | "wistia" | "custom" | "other";
  autoplay: boolean;
  controls: boolean;
  loop?: boolean;
  muted?: boolean;
  fitType?: "fill" | "cover" | "contain";
  opacity?: number;
  width?: string;
  height?: string;
  minWidth?: number;
  minHeight?: number;
  aspectRatioLock?: boolean;
  padding?: [number, number, number, number];
  margin?: [number, number, number, number];
  borderRadius?: [number, number, number, number];
  borderWidth?: number;
  position?: "relative" | "absolute";
  top?: string;
  left?: string;
  zIndex?: number;
  fillSpace?: "yes" | "no";
  flexBasis?: string;
  flexGrow?: number;
}

// Countdown expire event
export interface CountdownExpireEvent {
  eventType: "stay-on-page" | "hide-timer" | "redirect";
  eventData: null | { url: string };
}

// Countdown node props
export interface CountdownProps extends BaseNodeProps {
  mode?: "standard" | "daily" | "evergreen";
  dateTime: string; // ISO format
  type?: "default";
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  labelDays: string;
  labelHours: string;
  labelMinutes: string;
  labelSeconds: string;
  labelFontFamily?: string;
  labelFontWeight?: string;
  labelFontStyle?: string;
  labelFontSize?: string;
  labelTextColor?: RGBA;
  labelLetterSpacing?: number;
  numberFontFamily?: string;
  numberFontWeight?: string;
  numberFontStyle?: string;
  numberFontSize?: string;
  numberTextColor?: RGBA;
  numberLetterSpacing?: number;
  backgroundColor?: RGBA;
  gap?: number;
  width?: string;
  height?: string;
  minHeight?: number;
  padding?: [number, number, number, number];
  margin?: [number, number, number, number];
  borderRadius?: [number, number, number, number];
  borderWidth?: number;
  position?: "relative" | "absolute";
  zIndex?: number;
  fillSpace?: "yes" | "no";
  flexBasis?: string;
  clickEvent?: ClickEvent;
  expireEvent?: CountdownExpireEvent;
  color?: RGBA;
}

// Form followup action
export interface FormFollowupAction {
  type: "remain" | "redirect" | "message";
  url?: string;
  message?: string;
}

// Form node props
export interface FormProps extends BaseNodeProps {
  id?: string;
  name?: string;
  followupAction?: FormFollowupAction;
  width?: string;
  height?: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxWidthUnit?: "px" | "%";
  gap?: number;
  padding?: [number, number, number, number];
  margin?: [number, number, number, number];
  borderRadius?: [number, number, number, number];
  borderWidth?: number;
  borderColor?: RGBA;
  backgroundColor?: RGBA;
  position?: "relative" | "absolute";
  zIndex?: number;
  fillSpace?: "yes" | "no";
  flexBasis?: string;
  // Field styling
  fieldWidth?: string;
  fieldMaxWidth?: string;
  fieldMinWidth?: string;
  fieldMargin?: [number, number, number, number];
  fieldBorderRadius?: [number, number, number, number];
  fieldInputPadding?: [number, number, number, number];
  fieldLabelFontFamily?: string;
  fieldLabelFontSize?: string;
  fieldLabelFontWeight?: number;
  fieldLabelColor?: RGBA;
  fieldInputFontFamily?: string;
  fieldInputFontSize?: string;
  fieldInputFontWeight?: number;
  fieldInputTextColor?: RGBA;
  fieldInputBackgroundColor?: RGBA;
  fieldInputBorderColor?: RGBA;
  fieldInputBorderWidth?: number;
  aspectRatioLock?: boolean;
}

// Form field props
export interface FormFieldProps extends BaseNodeProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  width?: string;
  height?: string;
}

// Form submit button props
export interface FormSubmitButtonProps extends ButtonProps {
  submitText?: string;
}

// Node custom data
export interface NodeCustom {
  displayName: string;
  isLocked: boolean;
}

// Base craft node fields (without props for extension)
export interface BaseCraftNodeFields {
  type: NodeType;
  isCanvas: boolean;
  displayName: string;
  custom: NodeCustom;
  hidden: boolean;
  nodes: string[];
  linkedNodes: Record<string, string>;
  parent?: string;
}

// Base craft node with generic props
export interface BaseCraftNode extends BaseCraftNodeFields {
  props: Record<string, unknown>;
}

// Specific node types
export interface PageNode extends BaseCraftNodeFields {
  type: { resolvedName: "Page" };
  isCanvas: true;
  props: PageProps;
}

export interface ContainerNode extends BaseCraftNodeFields {
  type: { resolvedName: "Container" };
  isCanvas: true;
  props: ContainerProps;
}

export interface ButtonNode extends BaseCraftNodeFields {
  type: { resolvedName: "Button" };
  isCanvas: false;
  props: ButtonProps;
}

export interface TextNode extends BaseCraftNodeFields {
  type: { resolvedName: "Text" };
  isCanvas: false;
  props: TextProps;
}

export interface ImageNode extends BaseCraftNodeFields {
  type: { resolvedName: "Image" };
  isCanvas: false;
  props: ImageProps;
}

export interface VideoNode extends BaseCraftNodeFields {
  type: { resolvedName: "Video" };
  isCanvas: false;
  props: VideoProps;
}

export interface CountdownNode extends BaseCraftNodeFields {
  type: { resolvedName: "Countdown" };
  isCanvas: false;
  props: CountdownProps;
}

export interface FormNode extends BaseCraftNodeFields {
  type: { resolvedName: "Form" };
  isCanvas: true;
  props: FormProps;
}

// Union type for all craft nodes
export type CraftNode =
  | PageNode
  | ContainerNode
  | ButtonNode
  | TextNode
  | ImageNode
  | VideoNode
  | CountdownNode
  | FormNode
  | BaseCraftNode;

// Complete CraftJSON structure
export interface CraftJSON {
  ROOT: PageNode;
  [nodeId: string]: CraftNode | number;
  version: 10;
}

// =============================================================================
// SIMPLIFIED AGENT INPUT TYPES
// =============================================================================

/**
 * Simplified element types that the agent generates.
 * The utility layer expands these to full CraftJSON nodes.
 */

export interface AgentButtonElement {
  type: "button";
  text: string;
  backgroundColor?: RGBA;
  color?: RGBA;
  href?: string;
}

/**
 * Text element purposes for typography hierarchy
 */
export type TextPurpose =
  | "logo"
  | "headline"
  | "subheadline"
  | "body-text"
  | "feature-title"
  | "feature-description"
  | "testimonial-quote"
  | "testimonial-author"
  | "stat-number"
  | "stat-label"
  | "faq-question"
  | "faq-answer"
  | "section-heading";

export interface AgentTextElement {
  type: "text";
  content: string;
  purpose?: TextPurpose;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  color?: RGBA;
}

export interface AgentImageElement {
  type: "image";
  src: string;
  alt: string;
  width?: string;
  height?: string;
}

export interface AgentVideoElement {
  type: "video";
  url: string;
  provider?: "youtube" | "vimeo";
}

export interface AgentCountdownElement {
  type: "countdown";
  dateTime: string; // ISO format
}

export interface AgentFormField {
  type: "email" | "text";
  label?: string;
  placeholder?: string;
}

export interface AgentFormElement {
  type: "form";
  fields: AgentFormField[];
  submitText: string;
  submitBackgroundColor?: RGBA;
}

// Union type for all agent elements
export type AgentElement =
  | AgentButtonElement
  | AgentTextElement
  | AgentImageElement
  | AgentVideoElement
  | AgentCountdownElement
  | AgentFormElement;

/**
 * Section types for proper styling during expansion
 */
export type SectionType = "header" | "hero" | "features" | "cta" | "testimonials" | "about" | "faq" | "contact" | "stats" | "pricing";

/**
 * Layout types including hero-specific layouts
 */
export type SectionLayout =
  | "row"
  | "column"
  | "text-left-image-right"
  | "text-right-image-left"
  | "centered"
  | "centered-with-background"
  | "centered-with-form"
  | "three-column-grid"
  | "two-column-grid";

/**
 * Simplified section structure that the agent generates.
 */
export interface AgentSection {
  sectionType: SectionType;
  layout?: SectionLayout;
  backgroundColor?: RGBA;
  elements: AgentElement[];
}

/**
 * Simplified page input that the agent generates.
 * This is the primary interface the AI should output.
 */
export interface AgentPageInput {
  sections: AgentSection[];
}

/**
 * Result of rendering CraftJSON to HTML
 */
export interface RenderResult {
  html: string;
  error?: string;
}

/**
 * Combined generation result including CraftJSON and rendered HTML
 */
export interface CraftJSONGenerationResult {
  craftJSON: CraftJSON;
  agentInput: AgentPageInput;
  html: string;
  sections: string[];
}
