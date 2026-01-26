/**
 * CraftJSON Module
 *
 * Provides types, utilities, and services for working with CraftJSON -
 * the structured JSON format used by the Leadpages Builder.
 */

// Type exports
export type {
  // Color types
  RGBA,

  // Node types
  NodeType,
  TextStyleChild,
  TextStyleParagraph,
  PositionAnchorsState,
  VisibilitySettings,
  ClickEvent,
  ResponsiveOverrides,
  BaseNodeProps,
  PageProps,
  ContainerProps,
  ButtonProps,
  TextProps,
  ImageProps,
  VideoProps,
  CountdownProps,
  FormProps,
  FormFieldProps,
  FormSubmitButtonProps,
  NodeCustom,
  BaseCraftNode,
  PageNode,
  ContainerNode,
  ButtonNode,
  TextNode,
  ImageNode,
  VideoNode,
  CountdownNode,
  FormNode,
  CraftNode,
  CraftJSON,

  // Agent input types
  SectionType,
  SectionLayout,
  TextPurpose,
  AgentButtonElement,
  AgentTextElement,
  AgentImageElement,
  AgentVideoElement,
  AgentCountdownElement,
  AgentFormField,
  AgentFormElement,
  AgentElement,
  AgentSection,
  AgentPageInput,

  // Result types
  RenderResult,
  CraftJSONGenerationResult,
} from "./types";

// XML-Craft type exports
export type {
  ConversionContext,
  ValidationError,
  TRBL,
  GradientBackground,
  ParsedClickEvent,
  ParsedTextParagraph,
  ParsedTextSpan,
  ParsedOption,
} from "./xml-craft-types";

// XML-Craft constant exports
export {
  ELEMENT_TO_RESOLVED_NAME,
  RESOLVED_NAME_TO_ELEMENT,
  CANVAS_ELEMENTS,
  FORM_FIELD_ELEMENTS,
  SPECIAL_ELEMENTS,
  COMPONENT_DEFAULTS,
} from "./xml-craft-types";

// Utility exports
export { expandToCraftJSON, validateAgentInput } from "./expand";

// XML-Craft converter exports
export {
  xmlToCraftJson,
  craftJsonToXml,
  validateXmlCraft,
  validateCraftJson,
  createConversionContext,
} from "./xml-craft-converter";

// Render service exports
export {
  renderCraftJSON,
  renderCraftJSONWithRetry,
  checkRenderServiceHealth,
} from "./render";
