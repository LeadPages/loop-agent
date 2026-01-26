/**
 * XML-Craft Converter Tests
 *
 * Tests for deterministic two-way conversion between XML-Craft and CraftJSON.
 */

import {
  xmlToCraftJson,
  craftJsonToXml,
  validateXmlCraft,
  validateCraftJson,
  createConversionContext,
} from "./xml-craft-converter";
import type { CraftJSON } from "./types";

// =============================================================================
// TEST UTILITIES
// =============================================================================

/**
 * Simple assertion helper for tests
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Test runner
 */
function runTest(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`\u2713 ${name}`);
  } catch (error) {
    console.error(`\u2717 ${name}`);
    console.error(`  Error: ${error instanceof Error ? error.message : error}`);
  }
}

// =============================================================================
// TEST CASES
// =============================================================================

/**
 * Test basic XML to CraftJSON conversion
 */
function testBasicXmlToCraftJson(): void {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10" padding="20,20,20,20" backgroundColor="255,255,255,1">
  <Container flexDirection="column" alignItems="center" padding="40,20,40,20">
    <Text textAlign="center">
      <p><span font="Inter" size="48px" weight="700" color="0,0,0,1">Hello World</span></p>
    </Text>
  </Container>
</Page>`;

  const craftJson = xmlToCraftJson(xml, { timestamp: 1000000 });

  // Verify ROOT exists
  assert(craftJson.ROOT !== undefined, "ROOT should exist");
  assert(craftJson.ROOT.type.resolvedName === "Page", "ROOT should be Page");
  assert(craftJson.ROOT.nodes.length === 1, "ROOT should have 1 child");

  // Verify Container
  const containerId = craftJson.ROOT.nodes[0];
  const container = craftJson[containerId] as { type: { resolvedName: string }; nodes: string[]; parent?: string };
  assert(container !== undefined, "Container should exist");
  assert(container.type.resolvedName === "Container", "Child should be Container");
  assert(container.parent === "ROOT", "Container parent should be ROOT");

  // Verify Text
  const textId = container.nodes[0];
  const text = craftJson[textId] as { type: { resolvedName: string }; nodes: string[]; parent?: string };
  assert(text !== undefined, "Text should exist");
  assert(text.type.resolvedName === "Text", "Child should be Text");
  assert(text.parent === containerId, "Text parent should be Container");

  // Verify version
  assert(craftJson.version === 10, "Version should be 10");
}

/**
 * Test deterministic ID generation
 */
function testDeterministicIdGeneration(): void {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10">
  <Container>
    <Text><p><span>Test</span></p></Text>
  </Container>
  <Container>
    <Text><p><span>Test 2</span></p></Text>
  </Container>
</Page>`;

  // Convert twice with same timestamp
  const craftJson1 = xmlToCraftJson(xml, { timestamp: 1000000 });
  const craftJson2 = xmlToCraftJson(xml, { timestamp: 1000000 });

  // Verify IDs are identical
  const ids1 = Object.keys(craftJson1).filter((k) => k !== "version").sort();
  const ids2 = Object.keys(craftJson2).filter((k) => k !== "version").sort();

  assert(
    JSON.stringify(ids1) === JSON.stringify(ids2),
    "Node IDs should be identical for same input and timestamp"
  );
}

/**
 * Test explicit ID preservation
 */
function testExplicitIdPreservation(): void {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10">
  <Container id="hero_section">
    <Text id="headline"><p><span>Title</span></p></Text>
  </Container>
</Page>`;

  const craftJson = xmlToCraftJson(xml);

  // Verify explicit IDs are preserved
  assert(craftJson["hero_section"] !== undefined, "hero_section should exist");
  assert(craftJson["headline"] !== undefined, "headline should exist");
}

/**
 * Test CraftJSON to XML conversion
 */
function testCraftJsonToXml(): void {
  const craftJson: CraftJSON = {
    ROOT: {
      type: { resolvedName: "Page" },
      isCanvas: true,
      props: {
        fillSpace: "yes",
        padding: [20, 20, 20, 20],
        backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
        gap: 10,
        maxWidth: "100%",
        height: "auto",
        bgImageScale: 100,
        bgImageOpacity: 100,
        bgImageMode: "fill",
        bgImagePosition: "center center",
        tablet: {},
        mobile: {},
        breakpoint: "desktop",
        radius: 0,
      },
      displayName: "Page",
      custom: { displayName: "My Page", isLocked: false },
      hidden: false,
      nodes: ["container_1"],
      linkedNodes: {},
    },
    container_1: {
      type: { resolvedName: "Container" },
      isCanvas: true,
      props: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        width: "100%",
        height: "auto",
        minHeight: 200,
        minWidth: 100,
        maxWidth: 1200,
        maxWidthUnit: "px",
        padding: [40, 20, 40, 20],
        margin: [0, 0, 0, 0],
        borderRadius: [0, 0, 0, 0],
        borderWidth: 0,
        fillSpace: "no",
        overflow: "visible",
        position: "relative",
        zIndex: 0,
        visibility: { desktop: true, tablet: true, mobile: true },
        tablet: {},
        mobile: { padding: [20, 10, 20, 10] },
      },
      displayName: "Container",
      custom: { displayName: "Hero Section", isLocked: false },
      parent: "ROOT",
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    version: 10,
  } as CraftJSON;

  const xml = craftJsonToXml(craftJson);

  // Verify XML structure
  assert(xml.includes('<?xml version="1.0"'), "Should have XML declaration");
  assert(xml.includes("<Page"), "Should have Page element");
  assert(xml.includes("displayName=\"My Page\""), "Should include displayName");
  assert(xml.includes("<Container"), "Should have Container element");
  assert(xml.includes("displayName=\"Hero Section\""), "Should include Container displayName");
  assert(xml.includes("<Mobile"), "Should have Mobile breakpoint override");
}

/**
 * Test round-trip conversion (XML -> CraftJSON -> XML)
 */
function testRoundTripConversion(): void {
  const originalXml = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10" displayName="Test Page" padding="0,0,0,0" gap="0">
  <Container id="hero" displayName="Hero" flexDirection="column" alignItems="center" padding="60,20,60,20" gap="24">
    <Mobile padding="30,10,30,10" />
    <Text textAlign="center">
      <p><span font="Inter" size="48px" weight="700" color="17,24,39,1">Welcome</span></p>
    </Text>
  </Container>
</Page>`;

  // Convert to CraftJSON
  const craftJson = xmlToCraftJson(originalXml, { timestamp: 1000000 });

  // Convert back to XML
  const regeneratedXml = craftJsonToXml(craftJson);

  // Convert again to CraftJSON (should produce same structure)
  const craftJson2 = xmlToCraftJson(regeneratedXml, { timestamp: 1000000 });

  // Verify structure is equivalent
  assert(
    craftJson.ROOT.nodes.length === craftJson2.ROOT.nodes.length,
    "Node count should match after round-trip"
  );

  // Verify explicit ID is preserved
  assert(craftJson2["hero"] !== undefined, "Explicit ID 'hero' should be preserved");
}

/**
 * Test TRBL parsing
 */
function testTrblParsing(): void {
  // Test single value
  const xml1 = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10" padding="20">
</Page>`;
  const json1 = xmlToCraftJson(xml1);
  const padding1 = (json1.ROOT.props as { padding: number[] }).padding;
  assert(
    JSON.stringify(padding1) === JSON.stringify([20, 20, 20, 20]),
    "Single value should expand to all sides"
  );

  // Test two values
  const xml2 = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10" padding="20,10">
</Page>`;
  const json2 = xmlToCraftJson(xml2);
  const padding2 = (json2.ROOT.props as { padding: number[] }).padding;
  assert(
    JSON.stringify(padding2) === JSON.stringify([20, 10, 20, 10]),
    "Two values should expand to vert/horiz"
  );

  // Test four values
  const xml3 = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10" padding="1,2,3,4">
</Page>`;
  const json3 = xmlToCraftJson(xml3);
  const padding3 = (json3.ROOT.props as { padding: number[] }).padding;
  assert(
    JSON.stringify(padding3) === JSON.stringify([1, 2, 3, 4]),
    "Four values should be preserved"
  );
}

/**
 * Test RGBA parsing
 */
function testRgbaParsing(): void {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10" backgroundColor="59,130,246,0.8">
</Page>`;
  const json = xmlToCraftJson(xml);
  const bg = (json.ROOT.props as { backgroundColor: { r: number; g: number; b: number; a: number } }).backgroundColor;

  assert(bg.r === 59, "Red should be 59");
  assert(bg.g === 130, "Green should be 130");
  assert(bg.b === 246, "Blue should be 246");
  assert(bg.a === 0.8, "Alpha should be 0.8");
}

/**
 * Test validation
 */
function testValidation(): void {
  // Valid XML
  const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10">
  <Container>
    <Text><p><span>Hello</span></p></Text>
  </Container>
</Page>`;
  const validErrors = validateXmlCraft(validXml);
  assert(validErrors.length === 0, "Valid XML should have no errors");

  // Invalid root element
  const invalidRoot = `<?xml version="1.0" encoding="UTF-8"?>
<Container>
</Container>`;
  const rootErrors = validateXmlCraft(invalidRoot);
  assert(rootErrors.some((e) => e.code === "V1"), "Should report invalid root element");

  // Invalid TRBL format
  const invalidTrbl = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10" padding="1,2,3">
</Page>`;
  const trblErrors = validateXmlCraft(invalidTrbl);
  assert(trblErrors.some((e) => e.code === "V7"), "Should report invalid TRBL format");
}

/**
 * Test click event parsing
 */
function testClickEventParsing(): void {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10">
  <Container>
    <Button text="Click Me" backgroundColor="0,0,0,1">
      <ClickEvent type="open-external-link" url="https://example.com" newTab="true" />
    </Button>
  </Container>
</Page>`;

  const json = xmlToCraftJson(xml);
  const containerId = json.ROOT.nodes[0];
  const container = json[containerId] as { nodes: string[]; props: Record<string, unknown> };
  const buttonId = container.nodes[0];
  const button = json[buttonId] as { props: Record<string, unknown> };

  const clickEvent = button.props.clickEvent as { eventType: string; eventData: { url: string; newTab: boolean } };
  assert(clickEvent.eventType === "open-external-link", "Event type should be correct");
  assert(clickEvent.eventData.url === "https://example.com", "URL should be preserved");
  assert(clickEvent.eventData.newTab === true, "newTab should be true");
}

/**
 * Test breakpoint overrides
 */
function testBreakpointOverrides(): void {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Page version="10">
  <Container padding="40,20,40,20" flexDirection="row">
    <Tablet padding="30,15,30,15" />
    <Mobile padding="20,10,20,10" flexDirection="column" />
  </Container>
</Page>`;

  const json = xmlToCraftJson(xml);
  const containerId = json.ROOT.nodes[0];
  const container = json[containerId] as { props: Record<string, unknown> };
  const props = container.props as {
    tablet: { padding: number[] };
    mobile: { padding: number[]; flexDirection: string };
  };

  assert(
    JSON.stringify(props.tablet.padding) === JSON.stringify([30, 15, 30, 15]),
    "Tablet padding should be set"
  );
  assert(
    JSON.stringify(props.mobile.padding) === JSON.stringify([20, 10, 20, 10]),
    "Mobile padding should be set"
  );
  assert(props.mobile.flexDirection === "column", "Mobile flexDirection should be column");
}

// =============================================================================
// RUN TESTS
// =============================================================================

export function runAllTests(): void {
  console.log("\n=== XML-Craft Converter Tests ===\n");

  runTest("Basic XML to CraftJSON conversion", testBasicXmlToCraftJson);
  runTest("Deterministic ID generation", testDeterministicIdGeneration);
  runTest("Explicit ID preservation", testExplicitIdPreservation);
  runTest("CraftJSON to XML conversion", testCraftJsonToXml);
  runTest("Round-trip conversion", testRoundTripConversion);
  runTest("TRBL parsing", testTrblParsing);
  runTest("RGBA parsing", testRgbaParsing);
  runTest("Validation", testValidation);
  runTest("Click event parsing", testClickEventParsing);
  runTest("Breakpoint overrides", testBreakpointOverrides);

  console.log("\n=== Tests Complete ===\n");
}

// Run tests if executed directly
if (typeof process !== "undefined" && process.argv[1]?.includes("xml-craft-converter.test")) {
  runAllTests();
}
