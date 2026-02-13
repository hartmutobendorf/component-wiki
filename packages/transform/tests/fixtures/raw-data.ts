/**
 * Test fixtures for the denormalize function.
 *
 * These represent the normalized data that coda-sync outputs (data/raw/*.json),
 * already parsed through the shared Zod schemas.
 */
import type { RawData } from "../../src/denormalize.js";

// --- Lookup tables ---

const lookupTable = (rows: Record<string, { rowId: string; name: string }>) => ({
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows,
});

export const typesTable = lookupTable({
  "type-component": { rowId: "type-component", name: "Component" },
  "type-pattern": { rowId: "type-pattern", name: "Pattern" },
  "type-foundation": { rowId: "type-foundation", name: "Foundation" },
  "type-block": { rowId: "type-block", name: "Block" },
});

export const tiersTable = lookupTable({
  "tier-global": { rowId: "tier-global", name: "Global" },
  "tier-sites": { rowId: "tier-sites", name: "Sites" },
});

export const docStatusTable = lookupTable({
  "status-good": { rowId: "status-good", name: "All good" },
  "status-minimal": { rowId: "status-minimal", name: "Minimal" },
});

export const propertyTypesTable = lookupTable({
  "pt-boolean": { rowId: "pt-boolean", name: "Boolean" },
  "pt-string": { rowId: "pt-string", name: "String" },
  "pt-single-select": { rowId: "pt-single-select", name: "Single select" },
  "pt-slot": { rowId: "pt-slot", name: "Slot" },
  "pt-callback": { rowId: "pt-callback", name: "Callback" },
  "pt-unknown": { rowId: "pt-unknown", name: "Fancy type" },
});

export const editorsTable = lookupTable({
  "ed-01": { rowId: "ed-01", name: "Alice Smith" },
  "ed-02": { rowId: "ed-02", name: "Bob Jones" },
});

// --- Component rows ---

export const componentsTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "comp-button": {
      rowId: "comp-button",
      name: "Button",
      type: "type-component",
      tiers: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "2025-06-15T10:00:00.000Z",
      description: "A clickable button for triggering actions.",
      usage: "Use buttons for primary and secondary actions.",
      examples: "See the design system for usage examples.",
      figma: "https://www.figma.com/design/abc123/Library",
      code: "https://github.com/org/repo/tree/main/button",
      figmaComponentData: "",
      componentExampleImage: "images/button-example.png",
      anatomyImage: "images/button-anatomy.png",
      properties: ["prop-disabled", "prop-variant", "prop-label"],
      anatomy: ["anat-01", "anat-02"],
      changeLog: ["cl-01"],
      decisionLog: ["dl-01"],
      uiBlocksUsedInPattern: "",
    },
    "comp-toggle": {
      rowId: "comp-toggle",
      name: "Toggle switch",
      type: "type-component",
      tiers: "tier-sites",
      documentationStatus: "status-minimal",
      lastEdited: "2025-07-20T14:00:00.000Z",
      description: "A binary on/off control.",
      usage: "Use toggle for instant on/off switching.",
      examples: "",
      figma: "",
      code: "",
      figmaComponentData: "",
      componentExampleImage: ["images/toggle-example.png"],
      anatomyImage: ["images/toggle-anatomy.png"],
      properties: ["prop-checked"],
      anatomy: [],
      changeLog: [],
      decisionLog: [],
      uiBlocksUsedInPattern: "",
    },
    "comp-card-pattern": {
      rowId: "comp-card-pattern",
      name: "Card pattern",
      type: "type-pattern",
      tiers: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "2025-08-01T09:00:00.000Z",
      description: "A card layout pattern.",
      usage: "Use for content grouping.",
      examples: "",
      figma: "",
      code: "",
      figmaComponentData: "",
      componentExampleImage: "",
      anatomyImage: "",
      properties: [],
      anatomy: [],
      changeLog: [],
      decisionLog: [],
      uiBlocksUsedInPattern: ["comp-button", "comp-toggle"],
    },
    "comp-block-internal": {
      rowId: "comp-block-internal",
      name: "Internal block",
      type: "type-block",
      tiers: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "2025-08-01T09:00:00.000Z",
      description: "An internal building block.",
      usage: "",
      examples: "",
      figma: "",
      code: "",
      figmaComponentData: "",
      componentExampleImage: "",
      anatomyImage: "",
      properties: [],
      anatomy: [],
      changeLog: [],
      decisionLog: [],
      uiBlocksUsedInPattern: "",
    },
    "comp-no-anatomy": {
      rowId: "comp-no-anatomy",
      name: "Plain component",
      type: "type-foundation",
      tiers: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "2025-01-01T00:00:00.000Z",
      description: "",
      usage: "",
      examples: "",
      figma: "",
      code: "",
      figmaComponentData: "",
      componentExampleImage: "",
      anatomyImage: "",
      properties: [],
      anatomy: [],
      changeLog: [],
      decisionLog: [],
      uiBlocksUsedInPattern: "",
    },
  } as Record<string, any>,
};

// --- Property rows ---

export const propertiesTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "prop-disabled": {
      rowId: "prop-disabled",
      name: "disabled",
      required: false,
      type: "pt-boolean",
      description: "Prevents user interaction.",
      constraint: "Must be true or false",
      options: "true, false",
      defaultOption: "false",
      component: ["comp-button"],
    },
    "prop-variant": {
      rowId: "prop-variant",
      name: "variant",
      required: true,
      type: "pt-single-select",
      description: "Visual style of the button.",
      constraint: "",
      options: "primary, secondary, ghost",
      defaultOption: "primary",
      component: ["comp-button"],
    },
    "prop-label": {
      rowId: "prop-label",
      name: "label",
      required: true,
      type: "pt-string",
      description: "Button label text.",
      constraint: "Max 80 characters",
      options: "",
      defaultOption: "",
      component: ["comp-button"],
    },
    "prop-checked": {
      rowId: "prop-checked",
      name: "checked",
      required: false,
      type: "pt-boolean",
      description: "Whether the toggle is on.",
      constraint: "",
      options: "",
      defaultOption: false,
      component: ["comp-toggle"],
    },
  } as Record<string, any>,
};

// --- Anatomy rows ---

export const anatomyTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "anat-01": {
      rowId: "anat-01",
      number: 2,
      name: "Label",
      description: "The text label of the button.",
      component: "comp-button",
    },
    "anat-02": {
      rowId: "anat-02",
      number: 1,
      name: "Container",
      description: "The outer wrapper of the button.",
      component: "comp-button",
    },
  } as Record<string, any>,
};

// --- Changelog rows ---

export const changelogTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "cl-01": {
      rowId: "cl-01",
      name: "comp-button",
      when: "2025-06-15T10:00:00.000Z",
      what: "Initial documentation created",
      who: "ed-01",
    },
  } as Record<string, any>,
};

// --- Decision log rows ---

export const decisionLogTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "dl-01": {
      rowId: "dl-01",
      component: "comp-button",
      where: "Design review meeting",
      decisionMade: "Use filled style as default variant",
      link: "https://docs.example.com/decisions/001",
    },
  } as Record<string, any>,
};

// --- Helper to build a full RawData object ---

export function buildRawData(overrides?: Partial<RawData>): RawData {
  const base = {
    components: structuredClone(componentsTable) as any,
    properties: structuredClone(propertiesTable) as any,
    changelog: structuredClone(changelogTable) as any,
    anatomy: structuredClone(anatomyTable) as any,
    decisionLog: structuredClone(decisionLogTable) as any,
    types: structuredClone(typesTable) as any,
    tiers: structuredClone(tiersTable) as any,
    documentationStatuses: structuredClone(docStatusTable) as any,
    propertyTypes: structuredClone(propertyTypesTable) as any,
    editors: structuredClone(editorsTable) as any,
  };
  return { ...base, ...overrides };
}
