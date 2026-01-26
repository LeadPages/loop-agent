# XML-Craft: XML Abstraction for CraftJSON

This document specifies an XML format (XML-Craft) that provides a human-readable, hierarchical abstraction over CraftJSON. It includes complete specifications for two-way conversion between XML-Craft and CraftJSON.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Principles](#2-design-principles)
3. [XML Schema Overview](#3-xml-schema-overview)
4. [Element Reference](#4-element-reference)
5. [Attribute Mapping](#5-attribute-mapping)
6. [Complex Structures](#6-complex-structures)
7. [XML to CraftJSON Conversion](#7-xml-to-craftjson-conversion)
8. [CraftJSON to XML Conversion](#8-craftjson-to-xml-conversion)
9. [Validation Rules](#9-validation-rules)
10. [Complete Examples](#10-complete-examples)
11. [Edge Cases and Special Handling](#11-edge-cases-and-special-handling)
12. [Implementation Notes](#12-implementation-notes)

---

## 1. Overview

### Purpose

XML-Craft provides an alternative representation for CraftJSON that:

- Uses natural XML nesting to express parent-child relationships
- Eliminates the need for manual node ID management
- Provides a more readable format for AI agents generating page structures
- Supports lossless two-way conversion with CraftJSON

### Format Comparison

**CraftJSON (flat structure with ID references):**
```json
{
  "ROOT": { "type": { "resolvedName": "Page" }, "nodes": ["container_1"], ... },
  "container_1": { "parent": "ROOT", "nodes": ["text_1"], ... },
  "text_1": { "parent": "container_1", "nodes": [], ... }
}
```

**XML-Craft (natural hierarchy):**
```xml
<Page>
  <Container>
    <Text>Hello World</Text>
  </Container>
</Page>
```

---

## 2. Design Principles

### 2.1 Hierarchy Through Nesting

XML naturally represents tree structures. Child elements in XML-Craft are direct children of their parent elements, eliminating the need for:
- Manual node ID generation
- Parent-child ID references
- Maintaining bidirectional consistency

### 2.2 Sensible Defaults

XML-Craft uses intelligent defaults for all properties. Only non-default values need to be specified:
- Missing attributes use component defaults
- Breakpoint overrides are optional
- Colors default to component-specific defaults

### 2.3 Explicit Node IDs (Optional)

Node IDs can be explicitly specified via the `id` attribute when needed for:
- Cross-referencing (scroll-to-element actions)
- Preserving IDs during round-trip conversion
- Debugging and testing

### 2.4 Type Safety

The XML structure enforces valid component hierarchies:
- Only canvas elements (`Page`, `Container`, `Form`) can have children
- Form fields can only appear inside `Form` elements
- `Page` must be the root element

---

## 3. XML Schema Overview

### 3.1 Document Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Page xmlns="https://builder4.leadpages.com/xml-craft" version="10">
  <!-- Page content here -->
</Page>
```

### 3.2 Element Types

| Element | CraftJSON resolvedName | Canvas | Description |
|---------|------------------------|--------|-------------|
| `<Page>` | `Page` | Yes | Root element (required) |
| `<Container>` | `Container` | Yes | Flexbox layout container |
| `<Text>` | `Text` | No | Rich text content |
| `<Button>` | `Button` | No | Clickable button |
| `<Image>` | `Image` | No | Image display |
| `<Video>` | `Video` | No | Video embed |
| `<Form>` | `Form` | No* | Form container |
| `<EmailField>` | `FormEmailField` | No | Email input field |
| `<TextField>` | `FormTextField` | No | Text input field |
| `<PhoneField>` | `FormPhoneField` | No | Phone input field |
| `<ConsentField>` | `FormConsentField` | No | Checkbox consent |
| `<DropdownField>` | `FormDropdownField` | No | Dropdown select |
| `<SelectionField>` | `FormSelectionField` | No | Radio/checkbox group |
| `<SubmitButton>` | `FormSubmitButton` | No | Form submit button |
| `<Countdown>` | `Countdown` | No | Countdown timer |

*Form has `isCanvas: false` in CraftJSON but contains child nodes for form fields.

### 3.3 Attribute Categories

1. **Layout Attributes**: `width`, `height`, `minWidth`, `minHeight`, `maxWidth`, `flexDirection`, etc.
2. **Spacing Attributes**: `padding`, `margin`, `gap`
3. **Style Attributes**: `backgroundColor`, `color`, `borderWidth`, `borderRadius`, `opacity`
4. **Position Attributes**: `position`, `top`, `left`, `right`, `bottom`, `zIndex`
5. **Flex Attributes**: `fillSpace`, `flexBasis`, `flexGrow`, `alignItems`, `justifyContent`
6. **Visibility Attributes**: `visibility`, `hidden`
7. **Interaction Attributes**: `clickEvent`, `expireEvent`
8. **Metadata Attributes**: `id`, `displayName`, `isLocked`

---

## 4. Element Reference

### 4.1 Page Element

The root element representing the entire page.

```xml
<Page
  version="10"
  displayName="Landing Page"
  fillSpace="yes"
  padding="20,20,20,20"
  backgroundColor="255,255,255,1"
  color="0,0,0,1"
  maxWidth="100%"
  height="auto"
  gap="10"
  bgImage=""
  bgImageMode="fill"
  bgImagePosition="center center"
  bgImageScale="100"
  bgImageOpacity="100"
>
  <!-- Child elements (Containers) -->
</Page>
```

**Required**: Must be the root element.

**Children**: `Container` elements only.

**Key Attributes**:
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `version` | integer | `10` | Schema version |
| `fillSpace` | `yes\|no` | `yes` | Fill available space |
| `padding` | TRBL | `20,20,20,20` | Page padding |
| `backgroundColor` | RGBA | `255,255,255,1` | Background color |
| `color` | RGBA | `0,0,0,1` | Default text color |
| `gap` | integer | `10` | Gap between children |
| `maxWidth` | string | `100%` | Maximum width |

### 4.2 Container Element

Flexbox container for layout composition.

```xml
<Container
  id="hero_section"
  displayName="Hero Section"
  flexDirection="column"
  alignItems="center"
  justifyContent="center"
  gap="24"
  width="100%"
  height="auto"
  minHeight="200"
  maxWidth="1200"
  maxWidthUnit="px"
  padding="40,20,40,20"
  margin="0,0,0,0"
  backgroundColor=""
  borderWidth="0"
  borderRadius="0,0,0,0"
  fillSpace="no"
  overflow="visible"
  position="relative"
  zIndex="0"
  visibility="true,true,true"
>
  <!-- Child elements -->

  <!-- Optional responsive overrides -->
  <Tablet padding="30,16,30,16" />
  <Mobile padding="20,12,20,12" flexDirection="column" />
</Container>
```

**Children**: Any element except `Page` and form fields.

**Key Attributes**:
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `flexDirection` | `row\|column` | `column` | Main axis direction |
| `alignItems` | flex alignment | `center` | Cross-axis alignment |
| `justifyContent` | flex alignment | `center` | Main-axis alignment |
| `gap` | integer | `10` | Gap between children |
| `width` | string | `100%` | Width |
| `height` | string | `auto` | Height |
| `minHeight` | integer | `200` | Minimum height |
| `maxWidth` | integer | `1200` | Maximum width value |
| `maxWidthUnit` | `px\|%` | `px` | Max width unit |
| `fillSpace` | `yes\|no` | `no` | Fill parent space |
| `overflow` | overflow value | `visible` | Overflow behavior |
| `visibility` | bool,bool,bool | `true,true,true` | Desktop,tablet,mobile |

### 4.3 Text Element

Rich text content using simplified inline markup.

```xml
<Text
  id="headline"
  displayName="Headline"
  textAlign="center"
  lineHeight="1.5"
  width="100%"
  maxWidth="800"
  maxWidthUnit="px"
  padding="0,0,0,0"
  margin="0,0,0,0"
  fillSpace="yes"
  styleVariant="heading.h1"
  appliedGlobalStyle="true"
>
  <p>
    <span font="Inter" size="48px" weight="700" color="17,24,39,1">
      Welcome to Our Platform
    </span>
  </p>
  <p>
    <span font="Inter" size="18px" weight="400" color="107,114,128,1">
      Discover amazing features.
    </span>
  </p>
</Text>
```

**Children**: `<p>` elements containing `<span>` elements for text styling.

**Content Structure**:
```xml
<p>                           <!-- Paragraph -->
  <span                       <!-- Styled text run -->
    font="Inter"              <!-- fontFamily -->
    size="16px"               <!-- fontSize -->
    weight="400"              <!-- fontWeight: 400|500|600|700 -->
    style="normal"            <!-- fontStyle: normal|italic -->
    transform="none"          <!-- textTransform: none|uppercase|lowercase|capitalize -->
    spacing="0"               <!-- letterSpacing -->
    color="0,0,0,1"           <!-- RGBA color -->
  >
    Text content here
  </span>
</p>
```

**Shorthand for Simple Text**:
```xml
<Text textAlign="center" font="Inter" size="24px" weight="600" color="0,0,0,1">
  Simple text without complex formatting
</Text>
```

When text content is placed directly in `<Text>` with font attributes on the element, it creates a single paragraph with uniform styling.

**Key Attributes**:
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `textAlign` | alignment | `left` | Text alignment |
| `lineHeight` | number | `1.5` | Line height multiplier |
| `styleVariant` | variant | - | Global style variant |
| `appliedGlobalStyle` | boolean | `true` | Use global styles |

**Style Variants**:
- `heading.h1`, `heading.h2`, `heading.h3`
- `body.large`, `body.medium`, `body.small`

### 4.4 Button Element

Interactive button with click actions.

```xml
<Button
  id="cta_button"
  displayName="CTA Button"
  text="Get Started"
  buttonSize="large"
  buttonVariant="primary"
  buttonType="rounded"
  fillWidth="false"
  width="auto"
  height="auto"
  minWidth="64px"
  minHeight="32px"
  padding="12,32,12,32"
  margin="0,0,0,0"
  borderRadius="8,8,8,8"
  borderWidth="0"
  fontFamily="Inter"
  fontSize="18px"
  fontWeight="600"
  color="255,255,255,1"
  backgroundColor="59,130,246,1"
  hoverBackgroundColor="37,99,235,1"
  appliedGlobalStyle="true"
  fillSpace="no"
>
  <ClickEvent type="open-external-link" url="https://example.com" newTab="true" />
</Button>
```

**Children**: Optional `<ClickEvent>` element.

**Key Attributes**:
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | `Click Me` | Button label |
| `buttonSize` | `small\|medium\|large` | `medium` | Size preset |
| `buttonVariant` | `primary\|secondary\|outline\|ghost` | `primary` | Style variant |
| `buttonType` | `square\|rounded` | `square` | Corner style |
| `fillWidth` | boolean | `false` | Full width |
| `color` | RGBA | `255,255,255,1` | Text color |
| `backgroundColor` | RGBA | `0,0,0,1` | Background color |

### 4.5 Image Element

Image display with various fit options.

```xml
<Image
  id="hero_image"
  displayName="Hero Image"
  src="https://example.com/image.jpg"
  alt="Hero image description"
  fitType="cover"
  width="100%"
  height="400px"
  minWidth="0"
  minHeight="0"
  maxWidth="1200"
  maxWidthUnit="px"
  padding="0,0,0,0"
  margin="0,0,0,0"
  borderRadius="8,8,8,8"
  borderWidth="0"
  opacity="1"
  objectPosition="center center"
  fillSpace="yes"
  aspectRatioLock="false"
>
  <ClickEvent type="open-external-link" url="https://example.com" />
  <Mobile width="100%" height="250px" />
</Image>
```

**Children**: Optional `<ClickEvent>` and responsive override elements.

**Key Attributes**:
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | URL | `""` | Image source URL |
| `alt` | string | `""` | Alt text |
| `fitType` | fit value | `cover` | Object fit mode |
| `opacity` | 0-1 | `1` | Opacity |
| `aspectRatioLock` | boolean | `false` | Lock aspect ratio |

**Fit Types**: `cover`, `contain`, `fill`, `none`, `scale-down`, `tile`

### 4.6 Video Element

Video embed supporting multiple providers.

```xml
<Video
  id="demo_video"
  displayName="Demo Video"
  sourceType="url"
  url="https://www.youtube.com/watch?v=VIDEO_ID"
  videoProvider="youtube"
  autoplay="false"
  controls="true"
  fitType="fill"
  width="100%"
  height="315px"
  aspectRatioLock="true"
  padding="0,0,0,0"
  margin="0,0,0,0"
  borderRadius="0,0,0,0"
  opacity="1"
>
  <Mobile width="100%" height="200px" />
</Video>
```

**Embed Code Alternative**:
```xml
<Video
  sourceType="embed"
  videoProvider="custom"
>
  <EmbedCode><![CDATA[
    <iframe src="..." allowfullscreen></iframe>
  ]]></EmbedCode>
</Video>
```

**Key Attributes**:
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `sourceType` | `url\|embed` | `url` | Source type |
| `url` | URL | `""` | Video URL |
| `videoProvider` | provider | `youtube` | Video provider |
| `autoplay` | boolean | `false` | Auto-play |
| `controls` | boolean | `true` | Show controls |

**Video Providers**: `youtube`, `vimeo`, `wistia`, `custom`

### 4.7 Form Element

Form container with field styling.

```xml
<Form
  id="contact_form"
  displayName="Contact Form"
  name="Contact Form"
  width="100%"
  maxWidth="500"
  maxWidthUnit="px"
  padding="24,24,24,24"
  margin="0,0,0,0"
  borderRadius="12,12,12,12"
  borderWidth="1"
  borderColor="229,231,235,1"
  backgroundColor="255,255,255,1"

  fieldWidth="100%"
  fieldMargin="0,0,16,0"
  fieldBorderRadius="6,6,6,6"
  fieldInputPadding="10,12,10,12"
  fieldLabelFontFamily="Inter"
  fieldLabelFontSize="12px"
  fieldLabelFontWeight="500"
  fieldLabelColor="87,95,106,1"
  fieldInputFontFamily="Inter"
  fieldInputFontSize="14px"
  fieldInputTextColor="17,24,39,1"
  fieldInputBackgroundColor="255,255,255,1"
  fieldInputBorderColor="209,213,219,1"
  fieldInputBorderWidth="1"
>
  <FollowupAction type="redirect" url="https://example.com/thank-you" />

  <EmailField
    label="Email"
    placeholder="Enter your email"
    required="true"
    primaryEmailField="true"
  />

  <TextField
    label="Name"
    placeholder="Your name"
    required="false"
  />

  <SubmitButton
    text="Submit"
    variant="primary"
    size="large"
    fullWidth="true"
  />
</Form>
```

**Children**: `<FollowupAction>` and form field elements.

**Followup Action Types**:
```xml
<!-- Stay on page -->
<FollowupAction type="remain" />

<!-- Redirect -->
<FollowupAction type="redirect" url="https://example.com/thanks" />

<!-- Show message -->
<FollowupAction type="message" message="Thank you for submitting!" />
```

### 4.8 Form Field Elements

#### EmailField
```xml
<EmailField
  id="email_field_1"
  displayName="Email"
  label="Email Address"
  showLabel="false"
  placeholder="you@example.com"
  required="true"
  hidden="false"
  helpText=""
  showHelpText="false"
  primaryEmailField="true"
/>
```

#### TextField
```xml
<TextField
  id="name_field_1"
  displayName="Name"
  inputType="text"
  label="Full Name"
  showLabel="true"
  placeholder="John Doe"
  required="false"
  hidden="false"
  enforceCharacterLimit="false"
  characterLimit="100"
/>
```

**Input Types**: `text`, `textarea`, `number`

#### PhoneField
```xml
<PhoneField
  id="phone_field_1"
  displayName="Phone"
  label="Phone Number"
  placeholder="+1 (555) 000-0000"
  required="false"
/>
```

#### ConsentField
```xml
<ConsentField
  id="consent_field_1"
  displayName="Consent"
  label="I agree to the terms and conditions"
  required="true"
  defaultChecked="false"
/>
```

#### DropdownField
```xml
<DropdownField
  id="dropdown_field_1"
  displayName="Country"
  label="Select Country"
  placeholder="Choose..."
  required="false"
>
  <Option value="us" label="United States" />
  <Option value="uk" label="United Kingdom" />
  <Option value="ca" label="Canada" />
</DropdownField>
```

#### SelectionField
```xml
<SelectionField
  id="selection_field_1"
  displayName="Interests"
  label="Select your interests"
  selectionType="checkbox"
  required="false"
>
  <Option value="tech" label="Technology" />
  <Option value="design" label="Design" />
  <Option value="marketing" label="Marketing" />
</SelectionField>
```

**Selection Types**: `radio`, `checkbox`

#### SubmitButton
```xml
<SubmitButton
  id="submit_btn_1"
  displayName="Submit"
  text="Submit Form"
  variant="primary"
  size="large"
  fullWidth="true"
/>
```

### 4.9 Countdown Element

Countdown timer with expiration actions.

```xml
<Countdown
  id="offer_countdown"
  displayName="Offer Countdown"
  mode="standard"
  dateTime="2026-12-31T23:59:59.000Z"
  type="default"
  showDays="true"
  showHours="true"
  showMinutes="true"
  showSeconds="true"
  labelDays="Days"
  labelHours="Hours"
  labelMinutes="Minutes"
  labelSeconds="Seconds"
  labelFontFamily="Inter"
  labelFontSize="12px"
  labelFontWeight="400"
  labelTextColor="156,163,175,1"
  numberFontFamily="Inter"
  numberFontSize="32px"
  numberFontWeight="700"
  numberTextColor="255,255,255,1"
  backgroundColor="0,0,0,1"
  gap="16"
  width="100%"
  height="auto"
  minHeight="64"
  padding="16,24,16,24"
  borderRadius="8,8,8,8"
>
  <ExpireEvent type="redirect" url="https://example.com/expired" />
  <Mobile padding="12,16,12,16" numberFontSize="24px" />
</Countdown>
```

**Countdown Modes**:
- `standard` - Counts down to specific date/time
- `daily` - Resets daily at specified time
- `evergreen` - Per-visitor countdown (cookie-based)

**Expire Event Types**:
```xml
<ExpireEvent type="stay-on-page" />
<ExpireEvent type="hide-timer" />
<ExpireEvent type="redirect" url="https://example.com" />
```

---

## 5. Attribute Mapping

### 5.1 TRBL (Top, Right, Bottom, Left) Format

Spacing attributes use comma-separated TRBL format:

```xml
padding="20,16,20,16"    <!-- top=20, right=16, bottom=20, left=16 -->
margin="0,0,24,0"        <!-- bottom margin of 24 only -->
borderRadius="8,8,0,0"   <!-- rounded top corners -->
```

**Shorthand**:
```xml
padding="20"             <!-- All sides: 20,20,20,20 -->
padding="20,16"          <!-- Vertical/horizontal: 20,16,20,16 -->
```

### 5.2 RGBA Color Format

Colors use comma-separated RGBA:

```xml
backgroundColor="255,255,255,1"    <!-- White, opaque -->
color="0,0,0,0.5"                  <!-- Black, 50% transparent -->
borderColor="59,130,246,1"         <!-- Blue -->
```

**Special Values**:
```xml
backgroundColor=""                  <!-- Transparent/null -->
backgroundColor="transparent"       <!-- Explicit transparent -->
```

### 5.3 Visibility Format

Per-breakpoint visibility as comma-separated booleans:

```xml
visibility="true,true,true"         <!-- Visible on all breakpoints -->
visibility="true,true,false"        <!-- Hidden on mobile -->
visibility="true,false,false"       <!-- Desktop only -->
```

Order: `desktop,tablet,mobile`

### 5.4 Boolean Attributes

Boolean values use string representation:

```xml
required="true"
hidden="false"
autoplay="true"
fillWidth="false"
```

### 5.5 Numeric Attributes

Numbers can include units where applicable:

```xml
width="100%"
width="500px"
height="auto"
maxWidth="1200"          <!-- Unit from maxWidthUnit attribute -->
gap="24"                 <!-- Always pixels -->
opacity="0.8"            <!-- 0-1 range -->
zIndex="10"              <!-- Integer -->
```

---

## 6. Complex Structures

### 6.1 Rich Text (Slate.js)

Text content uses nested `<p>` and `<span>` elements:

```xml
<Text textAlign="left">
  <p>
    <span font="Inter" size="16px" weight="700" color="0,0,0,1">Bold text</span>
    <span font="Inter" size="16px" weight="400" color="0,0,0,1"> and normal text.</span>
  </p>
  <p>
    <span font="Inter" size="14px" weight="400" color="107,114,128,1">
      Second paragraph with different styling.
    </span>
  </p>
</Text>
```

**Conversion to CraftJSON textStyles**:
```json
{
  "textStyles": [
    {
      "type": "paragraph",
      "children": [
        {
          "text": "Bold text",
          "fontFamily": "Inter",
          "fontSize": "16px",
          "fontWeight": "700",
          "color": { "r": 0, "g": 0, "b": 0, "a": 1 }
        },
        {
          "text": " and normal text.",
          "fontFamily": "Inter",
          "fontSize": "16px",
          "fontWeight": "400",
          "color": { "r": 0, "g": 0, "b": 0, "a": 1 }
        }
      ]
    },
    {
      "type": "paragraph",
      "children": [
        {
          "text": "Second paragraph with different styling.",
          "fontFamily": "Inter",
          "fontSize": "14px",
          "fontWeight": "400",
          "color": { "r": 107, "g": 114, "b": 128, "a": 1 }
        }
      ]
    }
  ]
}
```

### 6.2 Click Events

Click events use a child `<ClickEvent>` element:

```xml
<!-- No link -->
<ClickEvent type="nolink" />

<!-- External URL -->
<ClickEvent type="open-external-link" url="https://example.com" newTab="true" nofollow="false" />

<!-- Internal page -->
<ClickEvent type="open-internal-page" pageId="uuid-here" />

<!-- Scroll to element -->
<ClickEvent type="scroll-to-element" elementId="section_signup" />

<!-- Download file -->
<ClickEvent type="download-file" fileUrl="https://example.com/file.pdf" />
```

**Conversion to CraftJSON**:
```json
{
  "clickEvent": {
    "eventType": "open-external-link",
    "eventData": {
      "url": "https://example.com",
      "newTab": true,
      "useNofollow": false
    }
  }
}
```

### 6.3 Responsive Breakpoints

Breakpoint overrides use child elements:

```xml
<Container
  flexDirection="row"
  padding="40,20,40,20"
  gap="24"
>
  <Tablet padding="30,16,30,16" gap="16" />
  <Mobile flexDirection="column" padding="20,12,20,12" gap="12" />

  <!-- Child elements -->
</Container>
```

**Breakpoint Elements**:
- `<Tablet>` - Overrides for tablet (768px - 1199px)
- `<Mobile>` - Overrides for mobile (< 768px)

**Detachable Properties by Component**:

| Component | Detachable Properties |
|-----------|----------------------|
| All | `padding`, `margin`, `borderRadius`, `position`, `left`, `right`, `top`, `bottom`, `zIndex` |
| Container | `flexDirection`, `width`, `height`, `fillSpace`, `flexBasis`, `gap`, `justifyContent`, `alignItems` |
| Text | `maxWidth`, `width`, `flexBasis`, `fillSpace` |
| Image | `width`, `height`, `fillSpace`, `flexBasis` |
| Video | `width`, `height`, `fillSpace`, `flexBasis` |
| Button | `buttonType` |
| Page | `gap` |

### 6.4 Gradient Backgrounds

Gradients use a child `<Gradient>` element:

```xml
<Container>
  <Gradient
    type="Linear"
    angle="90"
  >
    <Stop position="0" color="#FF0000" />
    <Stop position="100" color="#0000FF" />
  </Gradient>

  <!-- Children -->
</Container>
```

**Conversion to CraftJSON**:
```json
{
  "backgroundColor": {
    "type": "Linear",
    "angle": 90,
    "stops": [
      { "position": 0, "hexa": "#FF0000" },
      { "position": 100, "hexa": "#0000FF" }
    ]
  }
}
```

### 6.5 Position Anchors

Position anchor state uses attributes:

```xml
<Container
  position="absolute"
  positionAnchors="true"
  anchorTop="true"
  anchorLeft="true"
  anchorRight="false"
  anchorBottom="false"
  top="20px"
  left="20px"
/>
```

**Conversion to CraftJSON**:
```json
{
  "position": "absolute",
  "positionAnchorsState": {
    "enabled": true,
    "enableTop": true,
    "enableLeft": true,
    "enableRight": false,
    "enableBottom": false
  },
  "top": "20px",
  "left": "20px"
}
```

---

## 7. XML to CraftJSON Conversion

### 7.1 Algorithm Overview

```
1. Parse XML document
2. Validate root is <Page> element
3. Generate ROOT node for Page
4. Recursively process children:
   a. Generate unique node ID
   b. Create node object with props from attributes
   c. Set parent reference
   d. Add child ID to parent's nodes array
   e. Process child elements recursively
5. Add version number
6. Return flat CraftJSON object
```

### 7.2 Detailed Conversion Steps

#### Step 1: Parse and Validate

```typescript
function xmlToCraftJson(xmlString: string): CraftJson {
  const doc = parseXml(xmlString);
  const root = doc.documentElement;

  if (root.tagName !== 'Page') {
    throw new Error('Root element must be <Page>');
  }

  const craftJson: CraftJson = { version: 10 };
  const context = { nodeCounter: 0, timestamp: Date.now() };

  // Process ROOT node
  craftJson['ROOT'] = createNode(root, null, context);

  // Process children recursively
  processChildren(root, 'ROOT', craftJson, context);

  return craftJson;
}
```

#### Step 2: Node ID Generation

```typescript
function generateNodeId(elementName: string, context: Context): string {
  const random = Math.random().toString(36).substring(2, 11);
  return `${elementName.toLowerCase()}_${context.timestamp}_${random}`;
}

// If explicit id attribute exists, use it
function getNodeId(element: Element, context: Context): string {
  const explicitId = element.getAttribute('id');
  if (explicitId) {
    return explicitId;
  }
  return generateNodeId(getResolvedName(element.tagName), context);
}
```

#### Step 3: Element to Node Mapping

```typescript
const ELEMENT_TO_RESOLVED_NAME: Record<string, string> = {
  'Page': 'Page',
  'Container': 'Container',
  'Text': 'Text',
  'Button': 'Button',
  'Image': 'Image',
  'Video': 'Video',
  'Form': 'Form',
  'EmailField': 'FormEmailField',
  'TextField': 'FormTextField',
  'PhoneField': 'FormPhoneField',
  'ConsentField': 'FormConsentField',
  'DropdownField': 'FormDropdownField',
  'SelectionField': 'FormSelectionField',
  'SubmitButton': 'FormSubmitButton',
  'Countdown': 'Countdown'
};

const CANVAS_ELEMENTS = new Set(['Page', 'Container']);

function createNode(element: Element, parentId: string | null, context: Context): SerializedNode {
  const resolvedName = ELEMENT_TO_RESOLVED_NAME[element.tagName];
  const isCanvas = CANVAS_ELEMENTS.has(element.tagName);

  return {
    type: { resolvedName },
    isCanvas,
    props: extractProps(element, resolvedName),
    displayName: resolvedName,
    custom: {
      displayName: element.getAttribute('displayName') || resolvedName,
      isLocked: element.getAttribute('isLocked') === 'true'
    },
    hidden: element.getAttribute('hidden') === 'true',
    nodes: [],
    linkedNodes: {},
    parent: parentId ?? undefined
  };
}
```

#### Step 4: Attribute to Props Conversion

```typescript
function extractProps(element: Element, resolvedName: string): Record<string, any> {
  const props: Record<string, any> = {};
  const defaults = getComponentDefaults(resolvedName);

  // Process each attribute
  for (const attr of element.attributes) {
    const value = convertAttributeValue(attr.name, attr.value, resolvedName);
    if (value !== undefined) {
      props[attr.name] = value;
    }
  }

  // Merge with defaults
  return { ...defaults, ...props };
}

function convertAttributeValue(name: string, value: string, component: string): any {
  // TRBL attributes
  if (['padding', 'margin', 'borderRadius'].includes(name)) {
    return parseTRBL(value);
  }

  // RGBA attributes
  if (isColorAttribute(name)) {
    return parseRGBA(value);
  }

  // Visibility
  if (name === 'visibility') {
    return parseVisibility(value);
  }

  // Boolean
  if (isBooleanAttribute(name, component)) {
    return value === 'true';
  }

  // Number
  if (isNumericAttribute(name, component)) {
    return parseFloat(value);
  }

  // String (default)
  return value;
}

function parseTRBL(value: string): [number, number, number, number] {
  const parts = value.split(',').map(Number);

  switch (parts.length) {
    case 1: return [parts[0], parts[0], parts[0], parts[0]];
    case 2: return [parts[0], parts[1], parts[0], parts[1]];
    case 4: return parts as [number, number, number, number];
    default: throw new Error(`Invalid TRBL value: ${value}`);
  }
}

function parseRGBA(value: string): { r: number; g: number; b: number; a: number } | null {
  if (!value || value === 'transparent') {
    return null;
  }

  const [r, g, b, a] = value.split(',').map(Number);
  return { r, g, b, a: a ?? 1 };
}

function parseVisibility(value: string): { desktop: boolean; tablet: boolean; mobile: boolean } {
  const [desktop, tablet, mobile] = value.split(',').map(v => v === 'true');
  return { desktop, tablet, mobile };
}
```

#### Step 5: Process Special Child Elements

```typescript
function processChildren(
  element: Element,
  parentId: string,
  craftJson: CraftJson,
  context: Context
): void {
  const parentNode = craftJson[parentId];

  for (const child of element.children) {
    // Handle special elements
    if (child.tagName === 'Tablet' || child.tagName === 'Mobile') {
      processBreakpointOverride(child, parentNode.props);
      continue;
    }

    if (child.tagName === 'ClickEvent') {
      parentNode.props.clickEvent = parseClickEvent(child);
      continue;
    }

    if (child.tagName === 'ExpireEvent') {
      parentNode.props.expireEvent = parseExpireEvent(child);
      continue;
    }

    if (child.tagName === 'FollowupAction') {
      parentNode.props.followupAction = parseFollowupAction(child);
      continue;
    }

    if (child.tagName === 'Gradient') {
      parentNode.props.backgroundColor = parseGradient(child);
      continue;
    }

    if (child.tagName === 'EmbedCode') {
      parentNode.props.embedCode = child.textContent;
      continue;
    }

    if (child.tagName === 'Option') {
      // Handled by parent field
      continue;
    }

    // Handle text content (p, span) for Text elements
    if (child.tagName === 'p') {
      if (!parentNode.props.textStyles) {
        parentNode.props.textStyles = [];
      }
      parentNode.props.textStyles.push(parseTextParagraph(child));
      continue;
    }

    // Regular child node
    const childId = getNodeId(child, context);
    craftJson[childId] = createNode(child, parentId, context);
    parentNode.nodes.push(childId);

    // Recurse
    processChildren(child, childId, craftJson, context);
  }
}

function processBreakpointOverride(element: Element, props: Record<string, any>): void {
  const breakpoint = element.tagName.toLowerCase(); // 'tablet' or 'mobile'
  const overrides: Record<string, any> = {};

  for (const attr of element.attributes) {
    overrides[attr.name] = convertAttributeValue(attr.name, attr.value, 'Container');
  }

  props[breakpoint] = overrides;
}

function parseClickEvent(element: Element): ClickEvent {
  const type = element.getAttribute('type') || 'nolink';

  if (type === 'nolink') {
    return { eventType: 'nolink', eventData: null };
  }

  const eventData: Record<string, any> = {};

  if (element.hasAttribute('url')) {
    eventData.url = element.getAttribute('url');
  }
  if (element.hasAttribute('pageId')) {
    eventData.pageId = element.getAttribute('pageId');
  }
  if (element.hasAttribute('elementId')) {
    eventData.optionId = element.getAttribute('elementId');
  }
  if (element.hasAttribute('newTab')) {
    eventData.newTab = element.getAttribute('newTab') === 'true';
  }
  if (element.hasAttribute('nofollow')) {
    eventData.useNofollow = element.getAttribute('nofollow') === 'true';
  }
  if (element.hasAttribute('fileUrl')) {
    eventData.url = element.getAttribute('fileUrl');
  }

  return { eventType: type, eventData };
}

function parseTextParagraph(pElement: Element): TextParagraph {
  const children: TextSpan[] = [];

  for (const span of pElement.children) {
    if (span.tagName === 'span') {
      children.push({
        text: span.textContent || '',
        fontFamily: span.getAttribute('font') || 'Inter',
        fontSize: span.getAttribute('size') || '16px',
        fontWeight: span.getAttribute('weight') || '400',
        fontStyle: span.getAttribute('style') || 'normal',
        textTransform: span.getAttribute('transform') || 'none',
        letterSpacing: parseFloat(span.getAttribute('spacing') || '0'),
        color: parseRGBA(span.getAttribute('color') || '0,0,0,1')
      });
    }
  }

  // Handle direct text content
  if (children.length === 0 && pElement.textContent) {
    children.push({
      text: pElement.textContent,
      fontFamily: 'Inter',
      fontSize: '16px',
      fontWeight: '400',
      fontStyle: 'normal',
      textTransform: 'none',
      letterSpacing: 0,
      color: { r: 0, g: 0, b: 0, a: 1 }
    });
  }

  return { type: 'paragraph', children };
}
```

#### Step 6: Handle Simple Text Shorthand

```typescript
function processTextElement(element: Element, node: SerializedNode): void {
  // Check for simple text (direct content without <p> children)
  const hasTextChildren = Array.from(element.children).some(c => c.tagName === 'p');

  if (!hasTextChildren && element.textContent?.trim()) {
    // Use element attributes for styling
    const textStyles = [{
      type: 'paragraph',
      children: [{
        text: element.textContent.trim(),
        fontFamily: element.getAttribute('font') || 'Inter',
        fontSize: element.getAttribute('size') || '16px',
        fontWeight: element.getAttribute('weight') || '400',
        fontStyle: element.getAttribute('style') || 'normal',
        textTransform: element.getAttribute('transform') || 'none',
        letterSpacing: parseFloat(element.getAttribute('spacing') || '0'),
        color: parseRGBA(element.getAttribute('color') || '0,0,0,1')
      }]
    }];

    node.props.textStyles = textStyles;
  }
}
```

### 7.3 Complete XML to CraftJSON Example

**Input XML**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Page version="10" padding="0,0,0,0" backgroundColor="255,255,255,1" gap="0">
  <Container
    id="hero"
    displayName="Hero Section"
    flexDirection="column"
    alignItems="center"
    padding="80,20,80,20"
    maxWidth="1200"
  >
    <Mobile padding="40,12,40,12" />

    <Text displayName="Headline" textAlign="center" styleVariant="heading.h1">
      <p>
        <span font="Inter" size="48px" weight="700" color="17,24,39,1">
          Welcome
        </span>
      </p>
    </Text>

    <Button
      text="Get Started"
      buttonSize="large"
      backgroundColor="59,130,246,1"
      borderRadius="8,8,8,8"
    >
      <ClickEvent type="scroll-to-element" elementId="signup" />
    </Button>
  </Container>
</Page>
```

**Output CraftJSON**:
```json
{
  "ROOT": {
    "type": { "resolvedName": "Page" },
    "isCanvas": true,
    "props": {
      "padding": [0, 0, 0, 0],
      "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
      "gap": 0,
      "fillSpace": "yes",
      "maxWidth": "100%",
      "height": "auto",
      "tablet": {},
      "mobile": {}
    },
    "displayName": "Page",
    "custom": { "displayName": "Landing Page", "isLocked": false },
    "hidden": false,
    "nodes": ["hero"],
    "linkedNodes": {}
  },
  "hero": {
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
      "padding": [80, 20, 80, 20],
      "margin": [0, 0, 0, 0],
      "borderRadius": [0, 0, 0, 0],
      "borderWidth": 0,
      "fillSpace": "no",
      "visibility": { "desktop": true, "tablet": true, "mobile": true },
      "tablet": {},
      "mobile": { "padding": [40, 12, 40, 12] }
    },
    "displayName": "Container",
    "custom": { "displayName": "Hero Section", "isLocked": false },
    "hidden": false,
    "parent": "ROOT",
    "nodes": ["text_1737907200000_abc123", "button_1737907200000_def456"],
    "linkedNodes": {}
  },
  "text_1737907200000_abc123": {
    "type": { "resolvedName": "Text" },
    "isCanvas": false,
    "props": {
      "textStyles": [
        {
          "type": "paragraph",
          "children": [
            {
              "text": "Welcome",
              "fontFamily": "Inter",
              "fontSize": "48px",
              "fontWeight": "700",
              "fontStyle": "normal",
              "textTransform": "none",
              "letterSpacing": 0,
              "color": { "r": 17, "g": 24, "b": 39, "a": 1 }
            }
          ]
        }
      ],
      "textAlign": "center",
      "selectedStyleVariant": "heading.h1",
      "appliedGlobalStyle": true,
      "width": "100%",
      "padding": [0, 0, 0, 0],
      "margin": [0, 0, 0, 0],
      "visibility": { "desktop": true, "tablet": true, "mobile": true }
    },
    "displayName": "Text",
    "custom": { "displayName": "Headline", "isLocked": false },
    "hidden": false,
    "parent": "hero",
    "nodes": [],
    "linkedNodes": {}
  },
  "button_1737907200000_def456": {
    "type": { "resolvedName": "Button" },
    "isCanvas": false,
    "props": {
      "text": "Get Started",
      "buttonSize": "large",
      "buttonVariant": "primary",
      "buttonType": "square",
      "padding": [6, 16, 6, 16],
      "margin": [0, 0, 0, 0],
      "borderRadius": [8, 8, 8, 8],
      "backgroundColor": { "r": 59, "g": 130, "b": 246, "a": 1 },
      "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
      "clickEvent": {
        "eventType": "scroll-to-element",
        "eventData": { "optionId": "signup" }
      },
      "visibility": { "desktop": true, "tablet": true, "mobile": true }
    },
    "displayName": "Button",
    "custom": { "displayName": "Button", "isLocked": false },
    "hidden": false,
    "parent": "hero",
    "nodes": [],
    "linkedNodes": {}
  },
  "version": 10
}
```

---

## 8. CraftJSON to XML Conversion

### 8.1 Algorithm Overview

```
1. Parse CraftJSON object
2. Validate ROOT node exists with Page type
3. Create XML document with Page root
4. Build node lookup map for parent-child traversal
5. Recursively process nodes:
   a. Create element for node
   b. Convert props to attributes
   c. Add special child elements (events, breakpoints)
   d. Process child nodes in order
6. Return XML string
```

### 8.2 Detailed Conversion Steps

#### Step 1: Initialize and Validate

```typescript
function craftJsonToXml(craftJson: CraftJson): string {
  // Validate
  if (!craftJson.ROOT) {
    throw new Error('CraftJSON must have ROOT node');
  }

  if (craftJson.ROOT.type.resolvedName !== 'Page') {
    throw new Error('ROOT node must be Page component');
  }

  // Build parent-child map
  const childrenMap = buildChildrenMap(craftJson);

  // Create XML document
  const doc = createXmlDocument();
  const pageElement = createPageElement(doc, craftJson.ROOT, craftJson.version);
  doc.appendChild(pageElement);

  // Process children recursively
  processNodeChildren(doc, pageElement, 'ROOT', craftJson, childrenMap);

  return serializeXml(doc);
}

function buildChildrenMap(craftJson: CraftJson): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const [id, node] of Object.entries(craftJson)) {
    if (id === 'version') continue;
    map.set(id, node.nodes || []);
  }

  return map;
}
```

#### Step 2: Resolved Name to Element Mapping

```typescript
const RESOLVED_NAME_TO_ELEMENT: Record<string, string> = {
  'Page': 'Page',
  'Container': 'Container',
  'Text': 'Text',
  'Button': 'Button',
  'Image': 'Image',
  'Video': 'Video',
  'Form': 'Form',
  'FormEmailField': 'EmailField',
  'FormTextField': 'TextField',
  'FormPhoneField': 'PhoneField',
  'FormConsentField': 'ConsentField',
  'FormDropdownField': 'DropdownField',
  'FormSelectionField': 'SelectionField',
  'FormSubmitButton': 'SubmitButton',
  'Countdown': 'Countdown'
};
```

#### Step 3: Props to Attributes Conversion

```typescript
function propsToAttributes(element: Element, props: Record<string, any>, component: string): void {
  const defaults = getComponentDefaults(component);

  for (const [key, value] of Object.entries(props)) {
    // Skip breakpoint objects (handled separately)
    if (key === 'tablet' || key === 'mobile') continue;

    // Skip complex objects handled as child elements
    if (key === 'clickEvent' || key === 'expireEvent' || key === 'followupAction') continue;
    if (key === 'textStyles') continue;

    // Skip if value equals default
    if (deepEqual(value, defaults[key])) continue;

    // Convert to attribute
    const attrValue = valueToAttribute(key, value);
    if (attrValue !== null) {
      element.setAttribute(key, attrValue);
    }
  }
}

function valueToAttribute(key: string, value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Array (TRBL)
  if (Array.isArray(value)) {
    return value.join(',');
  }

  // RGBA object
  if (isRGBAObject(value)) {
    return `${value.r},${value.g},${value.b},${value.a}`;
  }

  // Visibility object
  if (isVisibilityObject(value)) {
    return `${value.desktop},${value.tablet},${value.mobile}`;
  }

  // Boolean
  if (typeof value === 'boolean') {
    return value.toString();
  }

  // Number or string
  return String(value);
}
```

#### Step 4: Process Special Props as Child Elements

```typescript
function addSpecialChildElements(
  doc: Document,
  element: Element,
  props: Record<string, any>,
  component: string
): void {
  // Breakpoint overrides
  if (props.tablet && Object.keys(props.tablet).length > 0) {
    const tabletEl = doc.createElement('Tablet');
    propsToAttributes(tabletEl, props.tablet, component);
    element.appendChild(tabletEl);
  }

  if (props.mobile && Object.keys(props.mobile).length > 0) {
    const mobileEl = doc.createElement('Mobile');
    propsToAttributes(mobileEl, props.mobile, component);
    element.appendChild(mobileEl);
  }

  // Click event
  if (props.clickEvent && props.clickEvent.eventType !== 'nolink') {
    element.appendChild(createClickEventElement(doc, props.clickEvent));
  }

  // Expire event (Countdown)
  if (props.expireEvent && props.expireEvent.eventType !== 'stay-on-page') {
    element.appendChild(createExpireEventElement(doc, props.expireEvent));
  }

  // Followup action (Form)
  if (props.followupAction) {
    element.appendChild(createFollowupActionElement(doc, props.followupAction));
  }

  // Text styles
  if (props.textStyles) {
    addTextStyleElements(doc, element, props.textStyles);
  }

  // Gradient background
  if (isGradient(props.backgroundColor)) {
    element.appendChild(createGradientElement(doc, props.backgroundColor));
  }

  // Embed code (Video)
  if (props.embedCode) {
    const embedEl = doc.createElement('EmbedCode');
    embedEl.appendChild(doc.createCDATASection(props.embedCode));
    element.appendChild(embedEl);
  }
}

function createClickEventElement(doc: Document, event: ClickEvent): Element {
  const el = doc.createElement('ClickEvent');
  el.setAttribute('type', event.eventType);

  if (event.eventData) {
    if (event.eventData.url) {
      el.setAttribute('url', event.eventData.url);
    }
    if (event.eventData.pageId) {
      el.setAttribute('pageId', event.eventData.pageId);
    }
    if (event.eventData.optionId) {
      el.setAttribute('elementId', event.eventData.optionId);
    }
    if (event.eventData.newTab !== undefined) {
      el.setAttribute('newTab', String(event.eventData.newTab));
    }
    if (event.eventData.useNofollow !== undefined) {
      el.setAttribute('nofollow', String(event.eventData.useNofollow));
    }
  }

  return el;
}

function addTextStyleElements(doc: Document, element: Element, textStyles: TextParagraph[]): void {
  for (const paragraph of textStyles) {
    const pEl = doc.createElement('p');

    for (const span of paragraph.children) {
      const spanEl = doc.createElement('span');

      if (span.fontFamily && span.fontFamily !== 'Inter') {
        spanEl.setAttribute('font', span.fontFamily);
      }
      if (span.fontSize && span.fontSize !== '16px') {
        spanEl.setAttribute('size', span.fontSize);
      }
      if (span.fontWeight && span.fontWeight !== '400') {
        spanEl.setAttribute('weight', span.fontWeight);
      }
      if (span.fontStyle && span.fontStyle !== 'normal') {
        spanEl.setAttribute('style', span.fontStyle);
      }
      if (span.textTransform && span.textTransform !== 'none') {
        spanEl.setAttribute('transform', span.textTransform);
      }
      if (span.letterSpacing && span.letterSpacing !== 0) {
        spanEl.setAttribute('spacing', String(span.letterSpacing));
      }
      if (span.color) {
        spanEl.setAttribute('color', `${span.color.r},${span.color.g},${span.color.b},${span.color.a}`);
      }

      spanEl.textContent = span.text;
      pEl.appendChild(spanEl);
    }

    element.appendChild(pEl);
  }
}
```

#### Step 5: Recursive Node Processing

```typescript
function processNodeChildren(
  doc: Document,
  parentElement: Element,
  parentId: string,
  craftJson: CraftJson,
  childrenMap: Map<string, string[]>
): void {
  const childIds = childrenMap.get(parentId) || [];

  for (const childId of childIds) {
    const node = craftJson[childId];
    if (!node) continue;

    const elementName = RESOLVED_NAME_TO_ELEMENT[node.type.resolvedName];
    const childElement = doc.createElement(elementName);

    // Add id attribute if it's a custom ID (not auto-generated pattern)
    if (!isAutoGeneratedId(childId)) {
      childElement.setAttribute('id', childId);
    }

    // Add displayName if customized
    if (node.custom?.displayName && node.custom.displayName !== node.displayName) {
      childElement.setAttribute('displayName', node.custom.displayName);
    }

    // Add isLocked if true
    if (node.custom?.isLocked) {
      childElement.setAttribute('isLocked', 'true');
    }

    // Add hidden if true
    if (node.hidden) {
      childElement.setAttribute('hidden', 'true');
    }

    // Convert props to attributes
    propsToAttributes(childElement, node.props, node.type.resolvedName);

    // Add special child elements
    addSpecialChildElements(doc, childElement, node.props, node.type.resolvedName);

    // Append to parent
    parentElement.appendChild(childElement);

    // Recurse for canvas nodes
    if (node.isCanvas || node.type.resolvedName === 'Form') {
      processNodeChildren(doc, childElement, childId, craftJson, childrenMap);
    }
  }
}

function isAutoGeneratedId(id: string): boolean {
  // Pattern: {type}_{timestamp}_{random}
  const pattern = /^[a-z]+_\d+_[a-z0-9]+$/i;
  return pattern.test(id);
}
```

### 8.3 Complete CraftJSON to XML Example

**Input CraftJSON**:
```json
{
  "ROOT": {
    "type": { "resolvedName": "Page" },
    "isCanvas": true,
    "props": {
      "fillSpace": "yes",
      "padding": [0, 0, 0, 0],
      "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 },
      "gap": 0,
      "tablet": {},
      "mobile": {}
    },
    "displayName": "Page",
    "custom": { "displayName": "My Landing Page", "isLocked": false },
    "hidden": false,
    "nodes": ["section_hero"],
    "linkedNodes": {}
  },
  "section_hero": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": {
      "flexDirection": "column",
      "alignItems": "center",
      "padding": [60, 20, 60, 20],
      "maxWidth": 1000,
      "mobile": { "padding": [30, 12, 30, 12] }
    },
    "displayName": "Container",
    "custom": { "displayName": "Hero", "isLocked": false },
    "parent": "ROOT",
    "nodes": ["headline_1"]
  },
  "headline_1": {
    "type": { "resolvedName": "Text" },
    "isCanvas": false,
    "props": {
      "textStyles": [
        {
          "type": "paragraph",
          "children": [
            {
              "text": "Hello World",
              "fontFamily": "Inter",
              "fontSize": "36px",
              "fontWeight": "700",
              "color": { "r": 0, "g": 0, "b": 0, "a": 1 }
            }
          ]
        }
      ],
      "textAlign": "center"
    },
    "displayName": "Text",
    "custom": { "displayName": "Headline", "isLocked": false },
    "parent": "section_hero",
    "nodes": []
  },
  "version": 10
}
```

**Output XML**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Page
  version="10"
  displayName="My Landing Page"
  padding="0,0,0,0"
  gap="0"
>
  <Container
    id="section_hero"
    displayName="Hero"
    flexDirection="column"
    alignItems="center"
    padding="60,20,60,20"
    maxWidth="1000"
  >
    <Mobile padding="30,12,30,12" />

    <Text displayName="Headline" textAlign="center">
      <p>
        <span font="Inter" size="36px" weight="700" color="0,0,0,1">
          Hello World
        </span>
      </p>
    </Text>
  </Container>
</Page>
```

---

## 9. Validation Rules

### 9.1 Structural Validation

| Rule | Description |
|------|-------------|
| V1 | Root element must be `<Page>` |
| V2 | Only canvas elements (`Page`, `Container`) can have component children |
| V3 | Form fields can only be children of `<Form>` |
| V4 | `<SubmitButton>` must be inside `<Form>` |
| V5 | No circular references (not possible in XML nesting) |
| V6 | All referenced IDs in events must exist |

### 9.2 Attribute Validation

| Rule | Description |
|------|-------------|
| V7 | TRBL values must have 1, 2, or 4 comma-separated numbers |
| V8 | RGBA values must have 3-4 comma-separated numbers (0-255, 0-255, 0-255, 0-1) |
| V9 | Visibility must have 3 comma-separated booleans |
| V10 | Boolean attributes must be `"true"` or `"false"` |
| V11 | Numeric attributes must be valid numbers |
| V12 | Enum attributes must use valid values |

### 9.3 Component-Specific Validation

| Component | Validation Rules |
|-----------|-----------------|
| Page | Must have `version` attribute |
| Container | `flexDirection` must be `row` or `column` |
| Text | Must have text content or `textStyles` |
| Button | `buttonSize` must be `small`, `medium`, or `large` |
| Image | `fitType` must be valid fit value |
| Video | `sourceType` must be `url` or `embed` |
| Form | Must have at least one field and `<SubmitButton>` |
| Countdown | `mode` must be `standard`, `daily`, or `evergreen` |

### 9.4 Validation Error Format

```typescript
interface ValidationError {
  code: string;        // e.g., "V1", "V7"
  message: string;     // Human-readable description
  element?: string;    // Element path or ID
  attribute?: string;  // Attribute name if applicable
  value?: string;      // Invalid value
}

// Example
{
  code: "V7",
  message: "Invalid TRBL format: expected 1, 2, or 4 numbers",
  element: "Container#hero",
  attribute: "padding",
  value: "10,20,30"
}
```

---

## 10. Complete Examples

### 10.1 Hero Section with CTA

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Page version="10" padding="0,0,0,0" backgroundColor="255,255,255,1">
  <Container
    id="hero"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    padding="100,20,100,20"
    minHeight="600"
    backgroundColor="17,24,39,1"
  >
    <Mobile padding="60,16,60,16" minHeight="400" />

    <Container
      flexDirection="column"
      alignItems="center"
      gap="24"
      maxWidth="800"
    >
      <Mobile gap="16" />

      <Text textAlign="center">
        <p>
          <span font="Inter" size="56px" weight="800" color="255,255,255,1">
            Build Landing Pages
          </span>
        </p>
        <p>
          <span font="Inter" size="56px" weight="800" color="59,130,246,1">
            That Convert
          </span>
        </p>
      </Text>

      <Text textAlign="center" maxWidth="600">
        <p>
          <span font="Inter" size="20px" weight="400" color="156,163,175,1">
            Create beautiful, high-converting landing pages in minutes with our
            drag-and-drop builder. No coding required.
          </span>
        </p>
      </Text>

      <Container flexDirection="row" gap="16" alignItems="center">
        <Mobile flexDirection="column" gap="12" />

        <Button
          text="Start Free Trial"
          buttonSize="large"
          backgroundColor="59,130,246,1"
          hoverBackgroundColor="37,99,235,1"
          padding="16,32,16,32"
          borderRadius="8,8,8,8"
          fontSize="18px"
          fontWeight="600"
        >
          <ClickEvent type="open-external-link" url="https://example.com/signup" />
        </Button>

        <Button
          text="Watch Demo"
          buttonSize="large"
          buttonVariant="outline"
          backgroundColor="0,0,0,0"
          color="255,255,255,1"
          borderWidth="2"
          borderColor="255,255,255,1"
          padding="16,32,16,32"
          borderRadius="8,8,8,8"
          fontSize="18px"
          fontWeight="600"
        >
          <ClickEvent type="scroll-to-element" elementId="demo_video" />
        </Button>
      </Container>
    </Container>
  </Container>
</Page>
```

### 10.2 Features Grid

```xml
<Container
  id="features"
  flexDirection="column"
  alignItems="center"
  padding="80,20,80,20"
  gap="48"
  backgroundColor="249,250,251,1"
>
  <Mobile padding="40,16,40,16" gap="32" />

  <Text textAlign="center" maxWidth="600">
    <p>
      <span font="Inter" size="40px" weight="700" color="17,24,39,1">
        Powerful Features
      </span>
    </p>
  </Text>

  <Container
    flexDirection="row"
    gap="24"
    maxWidth="1200"
    alignItems="stretch"
  >
    <Mobile flexDirection="column" />

    <!-- Feature Card 1 -->
    <Container
      flexDirection="column"
      alignItems="center"
      gap="16"
      padding="32,24,32,24"
      borderRadius="12,12,12,12"
      backgroundColor="255,255,255,1"
      fillSpace="yes"
      flexBasis="33%"
    >
      <Mobile flexBasis="100%" />

      <Image
        src="https://example.com/icon-1.svg"
        alt="Feature 1"
        width="64px"
        height="64px"
        fitType="contain"
      />

      <Text textAlign="center">
        <p>
          <span font="Inter" size="20px" weight="600" color="17,24,39,1">
            Drag & Drop Builder
          </span>
        </p>
      </Text>

      <Text textAlign="center">
        <p>
          <span font="Inter" size="16px" weight="400" color="107,114,128,1">
            Easily build pages with our intuitive drag and drop interface.
          </span>
        </p>
      </Text>
    </Container>

    <!-- Feature Card 2 -->
    <Container
      flexDirection="column"
      alignItems="center"
      gap="16"
      padding="32,24,32,24"
      borderRadius="12,12,12,12"
      backgroundColor="255,255,255,1"
      fillSpace="yes"
      flexBasis="33%"
    >
      <Mobile flexBasis="100%" />

      <Image
        src="https://example.com/icon-2.svg"
        alt="Feature 2"
        width="64px"
        height="64px"
        fitType="contain"
      />

      <Text textAlign="center">
        <p>
          <span font="Inter" size="20px" weight="600" color="17,24,39,1">
            Mobile Responsive
          </span>
        </p>
      </Text>

      <Text textAlign="center">
        <p>
          <span font="Inter" size="16px" weight="400" color="107,114,128,1">
            All pages automatically adapt to any screen size.
          </span>
        </p>
      </Text>
    </Container>

    <!-- Feature Card 3 -->
    <Container
      flexDirection="column"
      alignItems="center"
      gap="16"
      padding="32,24,32,24"
      borderRadius="12,12,12,12"
      backgroundColor="255,255,255,1"
      fillSpace="yes"
      flexBasis="33%"
    >
      <Mobile flexBasis="100%" />

      <Image
        src="https://example.com/icon-3.svg"
        alt="Feature 3"
        width="64px"
        height="64px"
        fitType="contain"
      />

      <Text textAlign="center">
        <p>
          <span font="Inter" size="20px" weight="600" color="17,24,39,1">
            Analytics Built-in
          </span>
        </p>
      </Text>

      <Text textAlign="center">
        <p>
          <span font="Inter" size="16px" weight="400" color="107,114,128,1">
            Track conversions and visitor behavior automatically.
          </span>
        </p>
      </Text>
    </Container>
  </Container>
</Container>
```

### 10.3 Lead Capture with Countdown

```xml
<Container
  id="signup"
  flexDirection="column"
  alignItems="center"
  padding="80,20,80,20"
  gap="32"
  backgroundColor="17,24,39,1"
>
  <Mobile padding="40,16,40,16" gap="24" />

  <Countdown
    mode="standard"
    dateTime="2026-02-28T23:59:59.000Z"
    showDays="true"
    showHours="true"
    showMinutes="true"
    showSeconds="true"
    labelDays="Days"
    labelHours="Hours"
    labelMinutes="Mins"
    labelSeconds="Secs"
    numberFontSize="48px"
    numberFontWeight="700"
    numberTextColor="255,255,255,1"
    labelFontSize="14px"
    labelTextColor="156,163,175,1"
    backgroundColor="0,0,0,0"
    gap="32"
    padding="0,0,0,0"
  >
    <Mobile numberFontSize="32px" gap="16" />
    <ExpireEvent type="hide-timer" />
  </Countdown>

  <Text textAlign="center" maxWidth="500">
    <p>
      <span font="Inter" size="32px" weight="700" color="255,255,255,1">
        Get 50% Off - Limited Time!
      </span>
    </p>
  </Text>

  <Container
    flexDirection="column"
    alignItems="center"
    gap="24"
    maxWidth="400"
    padding="32,32,32,32"
    borderRadius="16,16,16,16"
    backgroundColor="255,255,255,1"
  >
    <Form
      name="Early Access Signup"
      width="100%"
      padding="0,0,0,0"
      borderWidth="0"
      backgroundColor="0,0,0,0"
      fieldMargin="0,0,16,0"
      fieldBorderRadius="8,8,8,8"
      fieldInputPadding="12,16,12,16"
      fieldInputBorderColor="209,213,219,1"
    >
      <FollowupAction type="redirect" url="https://example.com/welcome" />

      <TextField
        label="Full Name"
        showLabel="false"
        placeholder="Your full name"
        required="true"
      />

      <EmailField
        label="Email"
        showLabel="false"
        placeholder="you@example.com"
        required="true"
        primaryEmailField="true"
      />

      <SubmitButton
        text="Claim Your Discount"
        variant="primary"
        size="large"
        fullWidth="true"
      />
    </Form>

    <Text textAlign="center">
      <p>
        <span font="Inter" size="12px" weight="400" color="107,114,128,1">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </span>
      </p>
    </Text>
  </Container>
</Container>
```

---

## 11. Edge Cases and Special Handling

### 11.1 Empty Text Content

When converting CraftJSON with empty text, preserve the structure:

```xml
<Text textAlign="center">
  <p>
    <span font="Inter" size="16px" weight="400" color="0,0,0,1"></span>
  </p>
</Text>
```

### 11.2 Special Characters in Text

Use XML entities or CDATA for special characters:

```xml
<Text>
  <p>
    <span>Prices start at &lt;$10 &amp; go up</span>
  </p>
</Text>

<!-- Or with CDATA -->
<Text>
  <p>
    <span><![CDATA[Prices start at <$10 & go up]]></span>
  </p>
</Text>
```

### 11.3 Preserving Node Order

Child nodes in XML maintain their order, which maps directly to the CraftJSON `nodes` array order:

```xml
<Container>
  <Text>First</Text>   <!-- nodes[0] -->
  <Text>Second</Text>  <!-- nodes[1] -->
  <Text>Third</Text>   <!-- nodes[2] -->
</Container>
```

### 11.4 ID Collisions

When converting XML to CraftJSON, check for ID collisions:

```typescript
function validateUniqueIds(doc: Document): string[] {
  const ids = new Set<string>();
  const duplicates: string[] = [];

  // Collect all explicit IDs
  const elementsWithId = doc.querySelectorAll('[id]');
  for (const el of elementsWithId) {
    const id = el.getAttribute('id');
    if (ids.has(id)) {
      duplicates.push(id);
    }
    ids.add(id);
  }

  return duplicates;
}
```

### 11.5 Cross-References

When an event references another element by ID, validate the reference:

```xml
<Button id="cta">
  <ClickEvent type="scroll-to-element" elementId="features" />
</Button>

<!-- The referenced element must exist -->
<Container id="features">
  ...
</Container>
```

### 11.6 Form Field Order

Form fields appear in the order they're defined in XML:

```xml
<Form>
  <EmailField />      <!-- Field 1 -->
  <TextField />       <!-- Field 2 -->
  <PhoneField />      <!-- Field 3 -->
  <SubmitButton />    <!-- Must be last -->
</Form>
```

### 11.7 Nested Responsive Overrides

Responsive overrides only affect the immediate parent element:

```xml
<Container padding="20,20,20,20">
  <Mobile padding="10,10,10,10" />  <!-- Only affects this Container -->

  <Container padding="16,16,16,16">
    <Mobile padding="8,8,8,8" />    <!-- Only affects this nested Container -->

    <Text>Content</Text>
  </Container>
</Container>
```

### 11.8 Default Value Omission

When converting CraftJSON to XML, omit attributes that match defaults to keep XML concise:

```typescript
// CraftJSON
{
  "props": {
    "flexDirection": "column",  // Default - omit
    "alignItems": "flex-start", // Non-default - include
    "gap": 10                   // Default - omit
  }
}

// XML output
<Container alignItems="flex-start">
  ...
</Container>
```

### 11.9 Gradient vs Solid Color

Detect gradient structure in CraftJSON:

```typescript
function isGradient(value: any): boolean {
  return value && typeof value === 'object' && 'type' in value && 'stops' in value;
}

// Gradient
{
  "backgroundColor": {
    "type": "Linear",
    "angle": 90,
    "stops": [...]
  }
}

// Solid color
{
  "backgroundColor": { "r": 255, "g": 255, "b": 255, "a": 1 }
}
```

### 11.10 Null vs Undefined vs Empty

Handle different "empty" representations:

| CraftJSON Value | XML Representation |
|-----------------|-------------------|
| `null` | Attribute omitted or `=""` |
| `undefined` | Attribute omitted |
| `""` (empty string) | `=""` |
| `{ r: 0, g: 0, b: 0, a: 0 }` | `="transparent"` |

---

## 12. Implementation Notes

### 12.1 Recommended Libraries

**JavaScript/TypeScript:**
- XML Parsing: `fast-xml-parser` or native `DOMParser`
- XML Serialization: `xmlbuilder2` or native `XMLSerializer`
- JSON Validation: `zod` or `ajv`

**Python:**
- XML: `lxml` or `xml.etree.ElementTree`
- JSON: Built-in `json` module

### 12.2 Performance Considerations

1. **Streaming for large documents**: For pages with many nodes, consider SAX-style parsing
2. **Caching defaults**: Cache component default props to avoid repeated lookups
3. **Lazy validation**: Validate on-demand rather than upfront for interactive tools

### 12.3 Error Recovery

Implement graceful degradation for malformed input:

```typescript
function safeParseAttribute(value: string, type: 'trbl' | 'rgba' | 'boolean'): any {
  try {
    switch (type) {
      case 'trbl': return parseTRBL(value);
      case 'rgba': return parseRGBA(value);
      case 'boolean': return value === 'true';
    }
  } catch (e) {
    console.warn(`Failed to parse ${type} value: ${value}`);
    return getDefaultForType(type);
  }
}
```

### 12.4 Extension Points

The XML-Craft format is designed for extension:

1. **Custom attributes**: Add `data-*` attributes for custom metadata
2. **Custom elements**: Use namespaced elements for extensions
3. **Processing instructions**: Use `<?xml-craft ...?>` for converter hints

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-craft generator="ai-agent-v1" timestamp="2026-01-26T12:00:00Z"?>
<Page xmlns="https://builder4.leadpages.com/xml-craft"
      xmlns:custom="https://builder4.leadpages.com/xml-craft/custom"
      version="10">
  <Container data-analytics-id="hero-section" custom:variant="premium">
    ...
  </Container>
</Page>
```

### 12.5 Testing Strategy

1. **Round-trip tests**: `XML → CraftJSON → XML` should produce equivalent output
2. **Snapshot tests**: Compare generated CraftJSON against known-good snapshots
3. **Fuzzing**: Generate random valid XML and verify CraftJSON output
4. **Edge case coverage**: Test all special cases documented above

### 12.6 Version Compatibility

The XML-Craft format version should match the CraftJSON schema version:

```xml
<Page version="10">  <!-- Must match current CraftJSON schema version -->
```

When CraftJSON schema changes:
1. Update XML-Craft spec to match
2. Document migration path
3. Consider supporting multiple versions in converter

---

## Appendix A: Quick Reference

### Element to resolvedName Mapping

| XML Element | CraftJSON resolvedName |
|-------------|------------------------|
| `Page` | `Page` |
| `Container` | `Container` |
| `Text` | `Text` |
| `Button` | `Button` |
| `Image` | `Image` |
| `Video` | `Video` |
| `Form` | `Form` |
| `EmailField` | `FormEmailField` |
| `TextField` | `FormTextField` |
| `PhoneField` | `FormPhoneField` |
| `ConsentField` | `FormConsentField` |
| `DropdownField` | `FormDropdownField` |
| `SelectionField` | `FormSelectionField` |
| `SubmitButton` | `FormSubmitButton` |
| `Countdown` | `Countdown` |

### Common Attribute Formats

| Format | Example | Description |
|--------|---------|-------------|
| TRBL | `"20,16,20,16"` | Top, Right, Bottom, Left |
| RGBA | `"59,130,246,1"` | Red, Green, Blue, Alpha |
| Visibility | `"true,true,false"` | Desktop, Tablet, Mobile |
| Boolean | `"true"` or `"false"` | String boolean |

### Special Child Elements

| Element | Parent(s) | Purpose |
|---------|-----------|---------|
| `<Tablet>` | Any | Tablet breakpoint overrides |
| `<Mobile>` | Any | Mobile breakpoint overrides |
| `<ClickEvent>` | `Button`, `Image`, `Countdown` | Click action |
| `<ExpireEvent>` | `Countdown` | Expiration action |
| `<FollowupAction>` | `Form` | Form submission action |
| `<Gradient>` | Any with backgroundColor | Gradient background |
| `<EmbedCode>` | `Video` | Raw embed HTML |
| `<Option>` | `DropdownField`, `SelectionField` | Select option |
| `<p>` | `Text` | Text paragraph |
| `<span>` | `<p>` | Styled text run |

---

*This specification is version 1.0, compatible with CraftJSON schema version 10.*
