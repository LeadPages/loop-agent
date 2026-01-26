# CraftJSON Generation Guide

This document provides a comprehensive guide for AI agents to generate valid CraftJSON for landing pages in Builder4.

---

## Table of Contents

1. [Overview](#1-overview)
2. [CraftJSON Structure](#2-craftjson-structure)
3. [Node Structure](#3-node-structure)
4. [Node ID Generation](#4-node-id-generation)
5. [Parent-Child Relationships](#5-parent-child-relationships)
6. [Component Types](#6-component-types)
7. [Responsive Breakpoints](#7-responsive-breakpoints)
8. [Color System](#8-color-system)
9. [Building Blocks Reference](#9-building-blocks-reference)
10. [Common Layout Patterns](#10-common-layout-patterns)
11. [Generation Best Practices](#11-generation-best-practices)
12. [Complete Examples](#12-complete-examples)

---

## 1. Overview

CraftJSON is the serialized format used by Builder4 to represent landing pages. It is based on CraftJS, a React-based visual page builder framework.

**Key Concepts:**
- A page is a tree of nodes, each representing a UI component
- The `ROOT` node is always a `Page` component
- Nodes reference each other via unique string IDs
- Each node stores its own props, parent reference, and child node IDs
- Responsive design is achieved through breakpoint-specific prop overrides

---

## 2. CraftJSON Structure

### Page Format

```json
{
  "ROOT": { /* Page node - always required */ },
  "nodeId1": { /* child node */ },
  "nodeId2": { /* another child */ },
  "version": 10
}
```

### Key Points

- `ROOT` is a reserved key that must always contain the Page component
- All other keys are unique node IDs
- `version` tracks the schema version (current: 10)
- Nodes are stored flat (not nested) - hierarchy is expressed via `parent` and `nodes` properties

---

## 3. Node Structure

Every node follows this structure:

```typescript
{
  "type": {
    "resolvedName": string  // Component type: "Page", "Container", "Text", "Button", etc.
  },
  "isCanvas": boolean,      // true if node can contain children
  "props": { ... },         // Component-specific properties
  "displayName": string,    // Component display name (matches resolvedName)
  "custom": {
    "displayName": string,  // User-facing name (can be customized)
    "isLocked": boolean     // Whether node is locked from editing
  },
  "parent": string,         // ID of parent node (empty string for ROOT)
  "hidden": boolean,        // Visibility in editor (not render visibility)
  "nodes": string[],        // IDs of direct child nodes (in order)
  "linkedNodes": {}         // Reserved for linked node references
}
```

### Canvas vs Non-Canvas Nodes

| Property | Canvas Nodes | Non-Canvas Nodes |
|----------|--------------|------------------|
| `isCanvas` | `true` | `false` |
| Can contain children | Yes | No |
| Examples | Page, Container, Form | Text, Button, Image, Video, Countdown |

---

## 4. Node ID Generation

Node IDs must be unique strings. Use this format for consistency:

```
{componentType}_{timestamp}_{randomSuffix}
```

**Examples:**
- `container_1769447200096_mwwtrlz4v`
- `text_1769447200097_abc123xyz`
- `button_1769447200098_def456uvw`

**Rules:**
- IDs must be unique within the entire CraftJSON document
- IDs should not contain spaces or special characters (except underscore)
- The `ROOT` key is reserved and must not be used as a node ID

**Simple Generation Pattern:**
```javascript
const generateNodeId = (componentType) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${componentType.toLowerCase()}_${timestamp}_${random}`;
};
```

---

## 5. Parent-Child Relationships

### Bidirectional References

Every node (except ROOT) must have:
1. A `parent` property pointing to its parent's ID
2. Its ID listed in the parent's `nodes` array

### Example Structure

```
ROOT (Page)
├── nodes: ["container_1", "container_2"]
│
├── container_1
│   ├── parent: "ROOT"
│   ├── nodes: ["text_1", "button_1"]
│   │
│   ├── text_1
│   │   ├── parent: "container_1"
│   │   └── nodes: []
│   │
│   └── button_1
│       ├── parent: "container_1"
│       └── nodes: []
│
└── container_2
    ├── parent: "ROOT"
    └── nodes: ["image_1"]
        │
        └── image_1
            ├── parent: "container_2"
            └── nodes: []
```

### Validation Rules

1. Every node's `parent` must reference an existing node ID (or be ROOT)
2. Every ID in a node's `nodes` array must exist in the document
3. If node A lists node B in its `nodes`, then node B's `parent` must be A
4. Non-canvas nodes (`isCanvas: false`) must have empty `nodes` arrays

---

## 6. Component Types

### 6.1 Page (ROOT only)

The root container for the entire page. Always uses the key `ROOT`.

```json
{
  "type": { "resolvedName": "Page" },
  "isCanvas": true,
  "displayName": "Page",
  "props": {
    "fillSpace": "yes",
    "padding": [20, 20, 20, 20],
    "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
    "color": { "r": 0, "g": 0, "b": 0, "a": 1 },
    "radius": 0,
    "maxWidth": "100%",
    "height": "auto",
    "gap": 10,
    "bgImageScale": 100,
    "bgImageOpacity": 100,
    "bgImageMode": "fill",
    "bgImagePosition": "center center",
    "bgVideoSourceType": "url",
    "bgVideoMode": "fill",
    "bgVideoOpacity": 100,
    "breakpoint": "desktop",
    "tablet": {},
    "mobile": {}
  },
  "custom": {
    "displayName": "Landing Page",
    "isLocked": false
  },
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Key Props:**
| Property | Type | Description |
|----------|------|-------------|
| `fillSpace` | `"yes" \| "no"` | Whether page fills available space |
| `padding` | `[top, right, bottom, left]` | Page padding in pixels |
| `backgroundColor` | `RGBA` | Page background color |
| `color` | `RGBA` | Default text color |
| `gap` | `number` | Gap between direct children |
| `maxWidth` | `string` | Maximum width (e.g., "100%", "1200px") |
| `height` | `string` | Height ("auto" recommended) |
| `bgImage` | `string \| null` | Background image URL |
| `bgImageMode` | `"fill" \| "fit" \| "stretch" \| "tile"` | Background sizing |
| `bgImagePosition` | `string` | Background position (e.g., "center center") |

---

### 6.2 Container

Flexbox container for layout. The primary building block for page structure.

```json
{
  "type": { "resolvedName": "Container" },
  "isCanvas": true,
  "displayName": "Container",
  "props": {
    "flexDirection": "column",
    "alignItems": "center",
    "justifyContent": "center",
    "gap": 10,
    "width": "100%",
    "height": "auto",
    "minHeight": 200,
    "minWidth": 100,
    "maxWidth": 1200,
    "maxWidthUnit": "px",
    "padding": [10, 10, 10, 10],
    "margin": [0, 0, 0, 0],
    "backgroundColor": null,
    "borderWidth": 0,
    "borderRadius": [0, 0, 0, 0],
    "shadow": 0,
    "opacity": 1,
    "overflow": "visible",
    "position": "relative",
    "zIndex": 0,
    "fillSpace": "no",
    "flexBasis": "100%",
    "flexGrow": 0,
    "bgImageScale": 100,
    "bgImageOpacity": 100,
    "bgImageMode": "fill",
    "bgImagePosition": "center center",
    "placeholderHeight": 512,
    "positionAnchorsState": {
      "enabled": false,
      "enableTop": false,
      "enableLeft": false,
      "enableRight": false,
      "enableBottom": false
    },
    "visibility": {
      "desktop": true,
      "tablet": true,
      "mobile": true
    },
    "aspectRatioLock": false,
    "tablet": {},
    "mobile": {}
  },
  "custom": {
    "displayName": "Container",
    "isLocked": false
  },
  "parent": "ROOT",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Key Props:**
| Property | Type | Description |
|----------|------|-------------|
| `flexDirection` | `"row" \| "column"` | Main axis direction |
| `alignItems` | `"flex-start" \| "center" \| "flex-end" \| "stretch"` | Cross-axis alignment |
| `justifyContent` | `"flex-start" \| "center" \| "flex-end" \| "space-between" \| "space-around"` | Main-axis alignment |
| `gap` | `number` | Gap between children in pixels |
| `width` | `string` | Width (e.g., "100%", "500px") |
| `height` | `string` | Height (e.g., "auto", "400px") |
| `minHeight` | `number` | Minimum height in pixels |
| `maxWidth` | `number` | Maximum width value |
| `maxWidthUnit` | `"px" \| "%"` | Unit for maxWidth |
| `fillSpace` | `"yes" \| "no"` | Whether to fill parent space |
| `flexBasis` | `string` | Flex basis (e.g., "100%", "auto") |
| `flexGrow` | `number` | Flex grow factor |
| `overflow` | `"visible" \| "hidden" \| "scroll" \| "auto"` | Overflow behavior |
| `visibility` | `object` | Per-breakpoint visibility |

---

### 6.3 Text

Rich text component using Slate.js format for content.

```json
{
  "type": { "resolvedName": "Text" },
  "isCanvas": false,
  "displayName": "Text",
  "props": {
    "textStyles": [
      {
        "type": "paragraph",
        "children": [
          {
            "text": "Your text content here",
            "fontFamily": "Inter",
            "fontSize": "18px",
            "fontWeight": "400",
            "fontStyle": "normal",
            "textTransform": "none",
            "letterSpacing": 0,
            "color": { "r": 0, "g": 0, "b": 0, "a": 1 }
          }
        ]
      }
    ],
    "textAlign": "left",
    "lineHeight": 1.5,
    "width": "100%",
    "height": "auto",
    "maxWidth": 1200,
    "maxWidthUnit": "px",
    "padding": [0, 0, 0, 0],
    "margin": [0, 0, 0, 0],
    "borderRadius": [0, 0, 0, 0],
    "shadow": 0,
    "position": "relative",
    "zIndex": 0,
    "fillSpace": "yes",
    "flexBasis": "100%",
    "appliedGlobalStyle": true,
    "selectedStyleVariant": "heading.h2",
    "htmlContent": "",
    "positionAnchorsState": {
      "enabled": false,
      "enableTop": false,
      "enableLeft": false,
      "enableRight": false,
      "enableBottom": false
    },
    "visibility": {
      "desktop": true,
      "tablet": true,
      "mobile": true
    },
    "tablet": {},
    "mobile": {}
  },
  "custom": {
    "displayName": "Text",
    "isLocked": false
  },
  "parent": "container_id",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Text Styles Format (Slate.js):**

The `textStyles` property uses Slate.js format:

```json
{
  "textStyles": [
    {
      "type": "paragraph",
      "children": [
        {
          "text": "Bold text",
          "fontWeight": "700",
          "fontFamily": "Inter",
          "fontSize": "16px"
        },
        {
          "text": " and normal text",
          "fontWeight": "400",
          "fontFamily": "Inter",
          "fontSize": "16px"
        }
      ]
    },
    {
      "type": "paragraph",
      "children": [
        {
          "text": "Second paragraph"
        }
      ]
    }
  ]
}
```

**Text Style Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `text` | `string` | The actual text content |
| `fontFamily` | `string` | Font family name |
| `fontSize` | `string` | Font size with unit (e.g., "16px") |
| `fontWeight` | `string` | Font weight ("400", "500", "600", "700") |
| `fontStyle` | `string` | "normal" or "italic" |
| `textTransform` | `string` | "none", "uppercase", "lowercase", "capitalize" |
| `letterSpacing` | `number` | Letter spacing in pixels |
| `color` | `RGBA` | Text color |

**Global Style Variants:**
- `heading.h1` - Large heading
- `heading.h2` - Medium heading
- `heading.h3` - Small heading
- `body.large` - Large body text
- `body.medium` - Medium body text
- `body.small` - Small body text

---

### 6.4 Button

Clickable button with customizable styling and actions.

```json
{
  "type": { "resolvedName": "Button" },
  "isCanvas": false,
  "displayName": "Button",
  "props": {
    "text": "Click Me",
    "buttonSize": "medium",
    "buttonVariant": "primary",
    "buttonType": "square",
    "fillWidth": false,
    "width": "auto",
    "height": "auto",
    "minWidth": "64px",
    "minHeight": "32px",
    "padding": [6, 16, 6, 16],
    "margin": [0, 0, 0, 0],
    "borderRadius": [0, 0, 0, 0],
    "borderWidth": 0,
    "textAlign": "center",
    "fontFamily": "Inter",
    "fontSize": "16px",
    "fontWeight": "400",
    "fontStyle": "normal",
    "letterSpacing": 0,
    "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
    "backgroundColor": { "r": 0, "g": 0, "b": 0, "a": 1 },
    "position": "relative",
    "top": "0px",
    "left": "0px",
    "zIndex": 0,
    "fillSpace": "no",
    "flexBasis": "auto",
    "appliedGlobalStyle": true,
    "clickEvent": {
      "eventType": "nolink",
      "eventData": null
    },
    "positionAnchorsState": {
      "enabled": false,
      "enableTop": false,
      "enableLeft": false,
      "enableRight": false,
      "enableBottom": false
    },
    "visibility": {
      "desktop": true,
      "tablet": true,
      "mobile": true
    },
    "tablet": {},
    "mobile": {}
  },
  "custom": {
    "displayName": "Button",
    "isLocked": false
  },
  "parent": "container_id",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Click Event Types:**

```json
// No link
{ "eventType": "nolink", "eventData": null }

// External URL
{
  "eventType": "open-external-link",
  "eventData": { "url": "https://example.com", "newTab": true }
}

// Internal page link
{
  "eventType": "open-internal-page",
  "eventData": { "pageId": "uuid-here" }
}

// Scroll to element
{
  "eventType": "scroll-to-element",
  "eventData": { "elementId": "node_id_here" }
}

// Download file
{
  "eventType": "download-file",
  "eventData": { "fileUrl": "https://example.com/file.pdf" }
}
```

**Button Variants:**
- `primary` - Primary action button
- `secondary` - Secondary action button
- `outline` - Outlined button
- `ghost` - Transparent button

**Button Sizes:**
- `small` - Compact size
- `medium` - Default size
- `large` - Large size

---

### 6.5 Image

Image component with various fit options.

```json
{
  "type": { "resolvedName": "Image" },
  "isCanvas": false,
  "displayName": "Image",
  "props": {
    "src": "https://example.com/image.jpg",
    "alt": "Description of image",
    "fitType": "cover",
    "width": "100%",
    "height": "492px",
    "minWidth": 0,
    "minHeight": 0,
    "maxWidth": 1200,
    "maxWidthUnit": "px",
    "padding": [0, 0, 0, 0],
    "margin": [0, 0, 0, 0],
    "borderRadius": [0, 0, 0, 0],
    "borderWidth": 0,
    "opacity": 1,
    "position": "relative",
    "top": "0px",
    "left": "0px",
    "zIndex": 0,
    "fillSpace": "yes",
    "flexBasis": "100%",
    "flexGrow": 0,
    "aspectRatioLock": false,
    "backgroundSize": "100%",
    "backgroundPosition": "left top",
    "objectPosition": "left top",
    "positionAnchorsState": {
      "enabled": false,
      "enableTop": false,
      "enableLeft": false,
      "enableRight": false,
      "enableBottom": false
    },
    "visibility": {
      "desktop": true,
      "tablet": true,
      "mobile": true
    },
    "tablet": {},
    "mobile": {
      "width": "100%",
      "fillSpace": "no",
      "flexBasis": "100%"
    }
  },
  "custom": {
    "displayName": "Image",
    "isLocked": false
  },
  "parent": "container_id",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Fit Types:**
| Value | Description |
|-------|-------------|
| `cover` | Image covers area, may be cropped |
| `contain` | Image fits within area, may have letterboxing |
| `fill` | Image stretches to fill area |
| `none` | Image at natural size |
| `scale-down` | Smaller of none or contain |
| `tile` | Image tiles/repeats |

---

### 6.6 Video

Video embed component supporting YouTube, Vimeo, Wistia, and custom embeds.

```json
{
  "type": { "resolvedName": "Video" },
  "isCanvas": false,
  "displayName": "Video",
  "props": {
    "sourceType": "url",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "embedCode": "",
    "videoProvider": "youtube",
    "autoplay": false,
    "controls": true,
    "fitType": "fill",
    "opacity": 1,
    "width": "100%",
    "height": "315px",
    "minWidth": 0,
    "minHeight": 0,
    "aspectRatioLock": true,
    "padding": [0, 0, 0, 0],
    "margin": [0, 0, 0, 0],
    "borderRadius": [0, 0, 0, 0],
    "borderWidth": 0,
    "position": "relative",
    "top": "0px",
    "left": "0px",
    "zIndex": 0,
    "fillSpace": "yes",
    "flexBasis": "100%",
    "flexGrow": 0,
    "positionAnchorsState": {
      "enabled": false,
      "enableTop": true,
      "enableLeft": true,
      "enableRight": false,
      "enableBottom": false
    },
    "visibility": {
      "desktop": true,
      "tablet": true,
      "mobile": true
    },
    "tablet": {},
    "mobile": {
      "width": "100%",
      "fillSpace": "no",
      "flexBasis": "100%"
    }
  },
  "custom": {
    "displayName": "Video",
    "isLocked": false
  },
  "parent": "container_id",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Video Providers:**
- `youtube` - YouTube videos
- `vimeo` - Vimeo videos
- `wistia` - Wistia videos
- `custom` - Custom embed code

**Source Types:**
- `url` - Video URL (YouTube, Vimeo, etc.)
- `embed` - Raw embed code (uses `embedCode` prop)

---

### 6.7 Form

Form container with configurable fields and submit button.

```json
{
  "type": { "resolvedName": "Form" },
  "isCanvas": false,
  "displayName": "Form",
  "props": {
    "id": "13adeeea-6cb4-452c-9c24-490186e373a0",
    "name": "Contact Form",
    "followupAction": { "type": "remain" },
    "width": "100%",
    "height": "auto",
    "minWidth": 100,
    "minHeight": 64,
    "maxWidth": 1200,
    "maxWidthUnit": "px",
    "padding": [16, 16, 16, 16],
    "margin": [0, 0, 0, 0],
    "borderRadius": [8, 8, 8, 8],
    "borderWidth": 1,
    "borderColor": { "r": 229, "g": 231, "b": 235, "a": 1 },
    "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
    "position": "relative",
    "zIndex": 0,
    "fillSpace": "yes",
    "flexBasis": "100%",
    "fieldWidth": "100%",
    "fieldMaxWidth": "100%",
    "fieldMinWidth": "0px",
    "fieldMargin": [0, 0, 16, 0],
    "fieldBorderRadius": [6, 6, 6, 6],
    "fieldInputPadding": [6, 8, 6, 8],
    "fieldLabelFontFamily": "Inter",
    "fieldLabelFontSize": "10px",
    "fieldLabelFontWeight": 500,
    "fieldLabelColor": { "r": 87, "g": 95, "b": 106, "a": 1 },
    "fieldInputFontFamily": "Inter",
    "fieldInputFontSize": "12px",
    "fieldInputFontWeight": 500,
    "fieldInputTextColor": { "r": 107, "g": 114, "b": 128, "a": 1 },
    "fieldInputBackgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
    "fieldInputBorderColor": { "r": 229, "g": 231, "b": 235, "a": 1 },
    "fieldInputBorderWidth": 1,
    "positionAnchorsState": {
      "enabled": false,
      "enableTop": false,
      "enableLeft": false,
      "enableRight": false,
      "enableBottom": false
    },
    "visibility": {
      "desktop": true,
      "tablet": true,
      "mobile": true
    },
    "aspectRatioLock": false
  },
  "custom": {
    "displayName": "Form",
    "isLocked": false
  },
  "parent": "container_id",
  "hidden": false,
  "nodes": ["field_1", "field_2", "submit_button"],
  "linkedNodes": {}
}
```

**Form Followup Actions:**
```json
// Stay on page
{ "type": "remain" }

// Redirect to URL
{ "type": "redirect", "url": "https://example.com/thank-you" }

// Show message
{ "type": "message", "message": "Thank you for submitting!" }
```

### Form Field Types

**Email Field:**
```json
{
  "type": { "resolvedName": "FormEmailField" },
  "isCanvas": false,
  "displayName": "Form Email Field",
  "props": {
    "id": "uuid-here",
    "inputType": "email",
    "label": "Email",
    "showLabel": false,
    "placeholder": "Email",
    "required": true,
    "hidden": false,
    "helpText": "",
    "showHelpText": false,
    "primaryEmailField": true
  },
  "custom": { "displayName": "Email", "isLocked": false },
  "parent": "form_id",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Text Field:**
```json
{
  "type": { "resolvedName": "FormTextField" },
  "isCanvas": false,
  "displayName": "Form Text Field",
  "props": {
    "id": "uuid-here",
    "inputType": "text",
    "label": "Name",
    "showLabel": false,
    "placeholder": "Your name",
    "required": false,
    "hidden": false,
    "helpText": "",
    "showHelpText": false,
    "enforceCharacterLimit": false
  },
  "custom": { "displayName": "Name", "isLocked": false },
  "parent": "form_id",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Submit Button:**
```json
{
  "type": { "resolvedName": "FormSubmitButton" },
  "isCanvas": false,
  "displayName": "Form Submit Button",
  "props": {
    "text": "Submit",
    "variant": "primary",
    "size": "medium",
    "fullWidth": true
  },
  "custom": { "displayName": "Submit", "isLocked": false },
  "parent": "form_id",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Other Form Field Types:**
- `FormPhoneField` - Phone number input
- `FormConsentField` - Checkbox consent field
- `FormDropdownField` - Dropdown select
- `FormSelectionField` - Radio/checkbox group

---

### 6.8 Countdown

Countdown timer with customizable display and expiration actions.

```json
{
  "type": { "resolvedName": "Countdown" },
  "isCanvas": false,
  "displayName": "Countdown",
  "props": {
    "mode": "standard",
    "dateTime": "2026-01-24T20:00:00.000Z",
    "type": "default",
    "showDays": true,
    "showHours": true,
    "showMinutes": true,
    "showSeconds": true,
    "labelDays": "Days",
    "labelHours": "Hours",
    "labelMinutes": "Minutes",
    "labelSeconds": "Seconds",
    "labelFontFamily": "Inter",
    "labelFontWeight": "400",
    "labelFontStyle": "normal",
    "labelFontSize": "12px",
    "labelTextColor": { "r": 156, "g": 163, "b": 175, "a": 1 },
    "labelLetterSpacing": 0.05,
    "numberFontFamily": "Inter",
    "numberFontWeight": "700",
    "numberFontStyle": "normal",
    "numberFontSize": "32px",
    "numberTextColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
    "numberLetterSpacing": 0,
    "backgroundColor": { "r": 0, "g": 0, "b": 0, "a": 1 },
    "gap": 16,
    "width": "100%",
    "height": "auto",
    "minHeight": 64,
    "padding": [16, 24, 16, 24],
    "margin": [0, 0, 0, 0],
    "borderRadius": [8, 8, 8, 8],
    "borderWidth": 0,
    "position": "relative",
    "zIndex": 0,
    "fillSpace": "yes",
    "flexBasis": "100%",
    "clickEvent": { "eventType": "nolink", "eventData": null },
    "expireEvent": { "eventType": "stay-on-page", "eventData": null },
    "positionAnchorsState": {
      "enabled": false,
      "enableTop": false,
      "enableLeft": false,
      "enableRight": false,
      "enableBottom": false
    },
    "visibility": {
      "desktop": true,
      "tablet": true,
      "mobile": true
    },
    "tablet": {},
    "mobile": {}
  },
  "custom": {
    "displayName": "Countdown",
    "isLocked": false
  },
  "parent": "container_id",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

**Countdown Modes:**
- `standard` - Counts down to specific date/time
- `daily` - Resets daily at specified time
- `evergreen` - Per-visitor countdown (uses cookies)

**Expire Events:**
```json
// Stay on page (do nothing)
{ "eventType": "stay-on-page", "eventData": null }

// Hide countdown
{ "eventType": "hide-timer", "eventData": null }

// Redirect
{ "eventType": "redirect", "eventData": { "url": "https://example.com" } }
```

---

## 7. Responsive Breakpoints

### Breakpoint Definitions

| Breakpoint | Width | Media Query |
|------------|-------|-------------|
| Desktop | 1200px+ | `@media (min-width: 1200px)` |
| Tablet | 768px - 1199px | `@media (min-width: 768px) and (max-width: 1199px)` |
| Mobile | < 768px | `@media (max-width: 767px)` |

### How Responsive Props Work

1. **Desktop props are the base** - defined at the root level of `props`
2. **Tablet/Mobile override specific props** - defined in `tablet` and `mobile` objects
3. **Only changed props need to be specified** - unspecified props inherit from desktop

```json
{
  "props": {
    // Desktop (base) values
    "flexDirection": "row",
    "padding": [20, 20, 20, 20],
    "gap": 20,
    "width": "100%",

    // Tablet overrides (only what changes)
    "tablet": {
      "padding": [16, 16, 16, 16],
      "gap": 16
    },

    // Mobile overrides (only what changes)
    "mobile": {
      "flexDirection": "column",
      "padding": [10, 10, 10, 10],
      "gap": 10
    }
  }
}
```

### Detachable Properties by Component

Only these properties can have breakpoint-specific values:

**All Components:**
- `padding`, `margin`, `borderRadius`
- `position`, `positionAnchorsState`, `left`, `right`, `top`, `bottom`, `zIndex`

**Container:**
- `flexDirection`, `width`, `height`, `fillSpace`, `flexBasis`, `gap`, `justifyContent`, `alignItems`

**Text:**
- `maxWidth`, `width`, `flexBasis`, `fillSpace`

**Image:**
- `width`, `height`, `fillSpace`, `flexBasis`

**Video:**
- `width`, `height`, `fillSpace`, `flexBasis`

**Button:**
- `buttonType`

**Page:**
- `gap`

---

## 8. Color System

### RGBA Format

Colors are represented as RGBA objects:

```json
{
  "r": 255,    // Red (0-255)
  "g": 128,    // Green (0-255)
  "b": 64,     // Blue (0-255)
  "a": 1       // Alpha (0-1)
}
```

### Common Colors

```json
// White
{ "r": 255, "g": 255, "b": 255, "a": 1 }

// Black
{ "r": 0, "g": 0, "b": 0, "a": 1 }

// Transparent
{ "r": 0, "g": 0, "b": 0, "a": 0 }

// Primary Blue
{ "r": 59, "g": 130, "b": 246, "a": 1 }

// Gray-100
{ "r": 243, "g": 244, "b": 246, "a": 1 }

// Gray-500
{ "r": 107, "g": 114, "b": 128, "a": 1 }

// Gray-900
{ "r": 17, "g": 24, "b": 39, "a": 1 }
```

### Gradients

```json
{
  "type": "Linear",
  "angle": 90,
  "stops": [
    { "position": 0, "hexa": "#FF0000" },
    { "position": 100, "hexa": "#0000FF" }
  ]
}
```

---

## 9. Building Blocks Reference

The following are pre-built component templates that can be copied and customized.

### Minimal Page Structure

```json
{
  "ROOT": {
    "type": { "resolvedName": "Page" },
    "isCanvas": true,
    "props": {
      "fillSpace": "yes",
      "padding": [20, 20, 20, 20],
      "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
      "color": { "r": 0, "g": 0, "b": 0, "a": 1 },
      "maxWidth": "100%",
      "height": "auto",
      "gap": 10,
      "tablet": {},
      "mobile": {}
    },
    "displayName": "Page",
    "custom": { "displayName": "Landing Page", "isLocked": false },
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "version": 10
}
```

### Section Container (Max-Width Wrapper)

Use this pattern to create centered, max-width sections:

```json
{
  "type": { "resolvedName": "Container" },
  "isCanvas": true,
  "props": {
    "flexDirection": "column",
    "alignItems": "center",
    "justifyContent": "center",
    "gap": 10,
    "width": "100%",
    "height": "auto",
    "minHeight": 200,
    "maxWidth": 1200,
    "maxWidthUnit": "px",
    "padding": [40, 20, 40, 20],
    "margin": [0, 0, 0, 0],
    "fillSpace": "no",
    "tablet": { "padding": [30, 16, 30, 16] },
    "mobile": { "padding": [20, 12, 20, 12] }
  }
}
```

---

## 10. Common Layout Patterns

### Two-Column Hero Layout

```json
{
  "ROOT": {
    "type": { "resolvedName": "Page" },
    "isCanvas": true,
    "props": {
      "fillSpace": "yes",
      "padding": [20, 20, 20, 20],
      "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
      "gap": 10,
      "tablet": {},
      "mobile": {}
    },
    "displayName": "Page",
    "custom": { "displayName": "Landing Page", "isLocked": false },
    "hidden": false,
    "nodes": ["section_1"],
    "linkedNodes": {}
  },
  "section_1": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "column",
      "alignItems": "center",
      "justifyContent": "center",
      "gap": 10,
      "width": "100%",
      "height": "auto",
      "maxWidth": 1200,
      "maxWidthUnit": "px",
      "padding": [40, 20, 40, 20],
      "mobile": { "padding": [20, 12, 20, 12] }
    },
    "displayName": "Container",
    "custom": { "displayName": "Section", "isLocked": false },
    "parent": "ROOT",
    "hidden": false,
    "nodes": ["row_1"],
    "linkedNodes": {}
  },
  "row_1": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "row",
      "alignItems": "center",
      "justifyContent": "center",
      "gap": 40,
      "width": "100%",
      "height": "auto",
      "padding": [0, 0, 0, 0],
      "mobile": { "flexDirection": "column", "gap": 20 }
    },
    "displayName": "Container",
    "custom": { "displayName": "Row", "isLocked": false },
    "parent": "section_1",
    "hidden": false,
    "nodes": ["col_left", "col_right"],
    "linkedNodes": {}
  },
  "col_left": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "column",
      "alignItems": "flex-start",
      "justifyContent": "center",
      "gap": 16,
      "width": "50%",
      "fillSpace": "yes",
      "flexBasis": "50%",
      "mobile": { "width": "100%", "flexBasis": "100%" }
    },
    "displayName": "Container",
    "custom": { "displayName": "Left Column", "isLocked": false },
    "parent": "row_1",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "col_right": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "column",
      "alignItems": "center",
      "justifyContent": "center",
      "gap": 16,
      "width": "50%",
      "fillSpace": "yes",
      "flexBasis": "50%",
      "mobile": { "width": "100%", "flexBasis": "100%" }
    },
    "displayName": "Container",
    "custom": { "displayName": "Right Column", "isLocked": false },
    "parent": "row_1",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "version": 10
}
```

### Centered Content Section

```json
{
  "section_centered": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "column",
      "alignItems": "center",
      "justifyContent": "center",
      "gap": 24,
      "width": "100%",
      "maxWidth": 800,
      "maxWidthUnit": "px",
      "padding": [60, 20, 60, 20],
      "mobile": { "padding": [40, 16, 40, 16], "gap": 16 }
    },
    "parent": "ROOT",
    "nodes": []
  }
}
```

### Card Grid (3 columns)

```json
{
  "grid_container": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "row",
      "alignItems": "stretch",
      "justifyContent": "center",
      "gap": 24,
      "width": "100%",
      "flexWrap": "wrap",
      "tablet": { "gap": 16 },
      "mobile": { "flexDirection": "column", "gap": 16 }
    },
    "nodes": ["card_1", "card_2", "card_3"]
  },
  "card_1": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "column",
      "alignItems": "center",
      "gap": 16,
      "width": "calc(33.333% - 16px)",
      "padding": [24, 24, 24, 24],
      "borderRadius": [8, 8, 8, 8],
      "backgroundColor": { "r": 249, "g": 250, "b": 251, "a": 1 },
      "mobile": { "width": "100%" }
    },
    "parent": "grid_container",
    "nodes": []
  }
}
```

---

## 11. Generation Best Practices

### Do's

1. **Always include version**: Set `"version": 10` at the root level
2. **Generate unique IDs**: Use timestamp + random suffix pattern
3. **Maintain bidirectional references**: Parent's `nodes` array must match children's `parent` property
4. **Set sensible defaults**: Use the building block templates as starting points
5. **Include responsive overrides**: Always consider mobile layout
6. **Use semantic structure**: Wrap content in section containers with max-width
7. **Keep forms simple**: Start with email field + submit button

### Don'ts

1. **Don't nest non-canvas nodes**: Text, Button, Image, Video, Countdown cannot have children
2. **Don't forget the ROOT node**: Every page must have exactly one ROOT with Page type
3. **Don't use invalid component names**: Only use the documented `resolvedName` values
4. **Don't break parent-child links**: Every child must have correct parent reference
5. **Don't omit required props**: Each component has required default props
6. **Don't use empty strings for colors**: Use RGBA objects or null

### Validation Checklist

Before outputting CraftJSON, verify:

- [ ] ROOT node exists with `type.resolvedName: "Page"`
- [ ] All node IDs are unique
- [ ] All `parent` references point to existing nodes
- [ ] All IDs in `nodes` arrays exist in the document
- [ ] Non-canvas nodes have empty `nodes` arrays
- [ ] Form fields have Form as parent
- [ ] Colors are valid RGBA objects
- [ ] `version: 10` is set

---

## 12. Complete Examples

### Example 1: Simple Landing Page with Hero

```json
{
  "ROOT": {
    "type": { "resolvedName": "Page" },
    "isCanvas": true,
    "props": {
      "fillSpace": "yes",
      "padding": [0, 0, 0, 0],
      "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
      "color": { "r": 0, "g": 0, "b": 0, "a": 1 },
      "maxWidth": "100%",
      "height": "auto",
      "gap": 0,
      "tablet": {},
      "mobile": {}
    },
    "displayName": "Page",
    "custom": { "displayName": "Landing Page", "isLocked": false },
    "hidden": false,
    "nodes": ["hero_section"],
    "linkedNodes": {}
  },
  "hero_section": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "column",
      "alignItems": "center",
      "justifyContent": "center",
      "gap": 0,
      "width": "100%",
      "height": "auto",
      "minHeight": 200,
      "maxWidth": 1200,
      "maxWidthUnit": "px",
      "padding": [80, 20, 80, 20],
      "margin": [0, 0, 0, 0],
      "borderRadius": [0, 0, 0, 0],
      "borderWidth": 0,
      "position": "relative",
      "zIndex": 0,
      "fillSpace": "no",
      "visibility": { "desktop": true, "tablet": true, "mobile": true },
      "tablet": { "padding": [60, 16, 60, 16] },
      "mobile": { "padding": [40, 12, 40, 12] }
    },
    "displayName": "Container",
    "custom": { "displayName": "Hero Section", "isLocked": false },
    "parent": "ROOT",
    "hidden": false,
    "nodes": ["hero_content"],
    "linkedNodes": {}
  },
  "hero_content": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "column",
      "alignItems": "center",
      "justifyContent": "center",
      "gap": 24,
      "width": "100%",
      "maxWidth": 800,
      "maxWidthUnit": "px",
      "padding": [0, 0, 0, 0],
      "visibility": { "desktop": true, "tablet": true, "mobile": true },
      "mobile": { "gap": 16 }
    },
    "displayName": "Container",
    "custom": { "displayName": "Hero Content", "isLocked": false },
    "parent": "hero_section",
    "hidden": false,
    "nodes": ["hero_headline", "hero_subheadline", "hero_cta"],
    "linkedNodes": {}
  },
  "hero_headline": {
    "type": { "resolvedName": "Text" },
    "isCanvas": false,
    "props": {
      "textStyles": [
        {
          "type": "paragraph",
          "children": [
            {
              "text": "Welcome to Our Platform",
              "fontFamily": "Inter",
              "fontSize": "48px",
              "fontWeight": "700",
              "color": { "r": 17, "g": 24, "b": 39, "a": 1 }
            }
          ]
        }
      ],
      "textAlign": "center",
      "width": "100%",
      "padding": [0, 0, 0, 0],
      "margin": [0, 0, 0, 0],
      "visibility": { "desktop": true, "tablet": true, "mobile": true },
      "tablet": {},
      "mobile": {}
    },
    "displayName": "Text",
    "custom": { "displayName": "Headline", "isLocked": false },
    "parent": "hero_content",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "hero_subheadline": {
    "type": { "resolvedName": "Text" },
    "isCanvas": false,
    "props": {
      "textStyles": [
        {
          "type": "paragraph",
          "children": [
            {
              "text": "Discover amazing features that will transform how you work and collaborate with your team.",
              "fontFamily": "Inter",
              "fontSize": "18px",
              "fontWeight": "400",
              "color": { "r": 107, "g": 114, "b": 128, "a": 1 }
            }
          ]
        }
      ],
      "textAlign": "center",
      "width": "100%",
      "padding": [0, 0, 0, 0],
      "margin": [0, 0, 0, 0],
      "visibility": { "desktop": true, "tablet": true, "mobile": true }
    },
    "displayName": "Text",
    "custom": { "displayName": "Subheadline", "isLocked": false },
    "parent": "hero_content",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "hero_cta": {
    "type": { "resolvedName": "Button" },
    "isCanvas": false,
    "props": {
      "text": "Get Started",
      "buttonSize": "large",
      "buttonVariant": "primary",
      "padding": [12, 32, 12, 32],
      "margin": [0, 0, 0, 0],
      "borderRadius": [8, 8, 8, 8],
      "fontFamily": "Inter",
      "fontSize": "18px",
      "fontWeight": "600",
      "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
      "backgroundColor": { "r": 59, "g": 130, "b": 246, "a": 1 },
      "clickEvent": {
        "eventType": "scroll-to-element",
        "eventData": { "elementId": "signup_section" }
      },
      "visibility": { "desktop": true, "tablet": true, "mobile": true }
    },
    "displayName": "Button",
    "custom": { "displayName": "CTA Button", "isLocked": false },
    "parent": "hero_content",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "version": 10
}
```

### Example 2: Lead Capture Form

```json
{
  "form_section": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "column",
      "alignItems": "center",
      "justifyContent": "center",
      "gap": 24,
      "width": "100%",
      "maxWidth": 500,
      "maxWidthUnit": "px",
      "padding": [40, 24, 40, 24],
      "backgroundColor": { "r": 249, "g": 250, "b": 251, "a": 1 },
      "borderRadius": [12, 12, 12, 12]
    },
    "parent": "ROOT",
    "nodes": ["form_title", "lead_form"]
  },
  "form_title": {
    "type": { "resolvedName": "Text" },
    "isCanvas": false,
    "props": {
      "textStyles": [
        {
          "type": "paragraph",
          "children": [
            {
              "text": "Get Early Access",
              "fontFamily": "Inter",
              "fontSize": "24px",
              "fontWeight": "600",
              "color": { "r": 17, "g": 24, "b": 39, "a": 1 }
            }
          ]
        }
      ],
      "textAlign": "center",
      "width": "100%"
    },
    "parent": "form_section",
    "nodes": []
  },
  "lead_form": {
    "type": { "resolvedName": "Form" },
    "isCanvas": false,
    "props": {
      "id": "lead-capture-form",
      "name": "Lead Capture",
      "followupAction": { "type": "message", "message": "Thanks! We'll be in touch." },
      "width": "100%",
      "padding": [0, 0, 0, 0],
      "borderWidth": 0,
      "backgroundColor": { "r": 0, "g": 0, "b": 0, "a": 0 },
      "fieldWidth": "100%",
      "fieldMargin": [0, 0, 12, 0],
      "fieldBorderRadius": [6, 6, 6, 6],
      "fieldInputPadding": [10, 12, 10, 12],
      "fieldInputFontSize": "14px",
      "fieldInputBorderColor": { "r": 209, "g": 213, "b": 219, "a": 1 }
    },
    "parent": "form_section",
    "nodes": ["email_field", "name_field", "submit_btn"]
  },
  "email_field": {
    "type": { "resolvedName": "FormEmailField" },
    "isCanvas": false,
    "props": {
      "id": "email-field-1",
      "label": "Email",
      "showLabel": false,
      "placeholder": "Enter your email",
      "required": true,
      "primaryEmailField": true
    },
    "parent": "lead_form",
    "nodes": []
  },
  "name_field": {
    "type": { "resolvedName": "FormTextField" },
    "isCanvas": false,
    "props": {
      "id": "name-field-1",
      "inputType": "text",
      "label": "Name",
      "showLabel": false,
      "placeholder": "Your name",
      "required": false
    },
    "parent": "lead_form",
    "nodes": []
  },
  "submit_btn": {
    "type": { "resolvedName": "FormSubmitButton" },
    "isCanvas": false,
    "props": {
      "text": "Sign Up",
      "variant": "primary",
      "size": "large",
      "fullWidth": true
    },
    "parent": "lead_form",
    "nodes": []
  }
}
```

---

## Appendix: Quick Reference

### Component resolvedName Values

| Component | resolvedName |
|-----------|--------------|
| Page | `"Page"` |
| Container | `"Container"` |
| Text | `"Text"` |
| Button | `"Button"` |
| Image | `"Image"` |
| Video | `"Video"` |
| Form | `"Form"` |
| Form Email Field | `"FormEmailField"` |
| Form Text Field | `"FormTextField"` |
| Form Phone Field | `"FormPhoneField"` |
| Form Consent Field | `"FormConsentField"` |
| Form Dropdown Field | `"FormDropdownField"` |
| Form Selection Field | `"FormSelectionField"` |
| Form Submit Button | `"FormSubmitButton"` |
| Countdown | `"Countdown"` |

### Spacing Arrays Format

All spacing arrays follow `[top, right, bottom, left]` order:

```json
"padding": [10, 20, 10, 20],   // top: 10, right: 20, bottom: 10, left: 20
"margin": [0, 0, 16, 0],       // only bottom margin of 16
"borderRadius": [8, 8, 0, 0]   // rounded top corners only
```

### Common Font Weights

| Weight | Description |
|--------|-------------|
| `"400"` | Normal/Regular |
| `"500"` | Medium |
| `"600"` | Semi-bold |
| `"700"` | Bold |

---

*This document is intended for AI agents generating CraftJSON. For human developers, refer to the component source files in `packages/shared/components/`.*
