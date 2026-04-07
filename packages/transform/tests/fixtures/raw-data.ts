/**
 * Test fixtures for denormalize functions.
 * Represent normalized coda-sync output (data/raw/*.json).
 */
import type { RawData } from "../../src/common/denormalize.js";

// --- Lookup tables ---

const lookupTable = (rows: Record<string, { rowId: string; name: string }>) => ({
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows,
});

export const constructTypesTable = lookupTable({
  "type-component": { rowId: "type-component", name: "Component" },
  "type-pattern": { rowId: "type-pattern", name: "Pattern" },
  "type-foundation": { rowId: "type-foundation", name: "Foundation" },
  "type-block": { rowId: "type-block", name: "Block" },
});

export const documentationTiersTable = lookupTable({
  "tier-global": { rowId: "tier-global", name: "Global" },
  "tier-sites": { rowId: "tier-sites", name: "Sites" },
});

export const documentationStatusTable = lookupTable({
  "status-good": { rowId: "status-good", name: "All good" },
  "status-minimal": { rowId: "status-minimal", name: "Minimal" },
});

export const constructPropertyTypesTable = lookupTable({
  "pt-boolean": { rowId: "pt-boolean", name: "Boolean" },
  "pt-string": { rowId: "pt-string", name: "String" },
  "pt-single-select": { rowId: "pt-single-select", name: "Single select" },
  "pt-slot": { rowId: "pt-slot", name: "Slot" },
  "pt-callback": { rowId: "pt-callback", name: "Callback" },
  "pt-unknown": { rowId: "pt-unknown", name: "Fancy type" },
});

export const documentationEditorsTable = lookupTable({
  "ed-01": { rowId: "ed-01", name: "Alice Smith" },
  "ed-02": { rowId: "ed-02", name: "Bob Jones" },
});

export const conceptTypesTable = lookupTable({
  "ct-guide": { rowId: "ct-guide", name: "Decision guide" },
  "ct-principle": { rowId: "ct-principle", name: "Design principle" },
});

// --- Construct rows ---

export const constructTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "comp-button": {
      rowId: "comp-button",
      name: "Button",
      type: "type-component",
      tier: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "2025-06-15T10:00:00.000Z",
      description: "A clickable button for triggering actions.",
      usage: "Use buttons for primary and secondary actions.",
      examples: "See the design system for usage examples.",
      interactions: "",
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
      "sites-ArchitectureLevels": "",
      appliedRule: [],
      exceptionFromRule: [],
    },
    "comp-toggle": {
      rowId: "comp-toggle",
      name: "Toggle switch",
      type: "type-component",
      tier: "tier-sites",
      documentationStatus: "status-minimal",
      lastEdited: "2025-07-20T14:00:00.000Z",
      description: "A binary on/off control.",
      usage: "Use toggle for instant on/off switching.",
      examples: "",
      interactions: "",
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
      "sites-ArchitectureLevels": "UI component",
      appliedRule: ["rule-01"],
      exceptionFromRule: [],
    },
    "comp-card-pattern": {
      rowId: "comp-card-pattern",
      name: "Card pattern",
      type: "type-pattern",
      tier: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "2025-08-01T09:00:00.000Z",
      description: "A card layout pattern.",
      usage: "Use for content grouping.",
      examples: "",
      interactions: "",
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
      "sites-ArchitectureLevels": "",
      appliedRule: [],
      exceptionFromRule: [],
    },
    "comp-block-internal": {
      rowId: "comp-block-internal",
      name: "Internal block",
      type: "type-block",
      tier: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "2025-08-01T09:00:00.000Z",
      description: "An internal building block.",
      usage: "",
      examples: "",
      interactions: "",
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
      "sites-ArchitectureLevels": "",
      appliedRule: [],
      exceptionFromRule: [],
    },
    "comp-no-anatomy": {
      rowId: "comp-no-anatomy",
      name: "Plain component",
      type: "type-foundation",
      tier: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "2025-01-01T00:00:00.000Z",
      description: "",
      usage: "",
      examples: "",
      interactions: "",
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
      "sites-ArchitectureLevels": "",
      appliedRule: [],
      exceptionFromRule: [],
    },
  } as Record<string, any>,
};

// --- Construct Property rows ---

export const constructPropertiesTable = {
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

// --- Construct Anatomy rows ---

export const constructAnatomyTable = {
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

// --- Documentation Changelog rows ---

export const documentationChangelogTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "cl-01": {
      rowId: "cl-01",
      construct: "comp-button",
      when: "2025-06-15T10:00:00.000Z",
      what: "Initial documentation created",
      who: "ed-01",
      concept: "",
      rules: "",
    },
    "cl-02": {
      rowId: "cl-02",
      construct: "",
      when: "2026-01-15T10:00:00.000Z",
      what: "Added concept content",
      who: "ed-02",
      concept: "conc-site",
      rules: "",
    },
  } as Record<string, any>,
};

// --- Documentation Decisionlog rows ---

export const documentationDecisionlogTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "dl-01": {
      rowId: "dl-01",
      construct: "comp-button",
      where: "Design review meeting",
      what: "Use filled style as default variant",
      link: "https://docs.example.com/decisions/001",
      concept: "",
      when: "",
      rules: "",
    },
  } as Record<string, any>,
};

// --- Concepts rows ---

export const conceptsTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "conc-site": {
      rowId: "conc-site",
      name: "Site",
      type: "ct-guide",
      documentationStatus: "status-good",
      tier: "tier-global",
      description: "The complete web property.",
      content: "Detailed content about sites.",
      lastEdited: "2026-02-18T09:29:54.400+00:00",
      decisionlog: [],
      changelog: ["cl-02"],
      appliedRule: ["rule-01"],
      exceptedFromRule: [],
    },
    "conc-page": {
      rowId: "conc-page",
      name: "Page",
      type: "ct-principle",
      documentationStatus: "status-minimal",
      tier: "tier-sites",
      description: "A single web page within a site.",
      content: "",
      lastEdited: "2026-02-18T10:00:00.000+00:00",
      decisionlog: [],
      changelog: [],
      appliedRule: [],
      exceptedFromRule: ["rule-01"],
    },
  } as Record<string, any>,
};

// --- Rules rows ---

export const rulesTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "rule-01": {
      rowId: "rule-01",
      rule: "Dividers must separate sections.",
      knownExceptionForThisConstruct: "",
      appliesToTheseConcepts: ["conc-site"],
      ruleStrength: ["rl-must"],
      status: ["rs-approved"],
      type: ["rt-specific"],
      lastEdited: "2026-02-18T09:35:07.035+00:00",
      changelog: [],
      decisionlog: [],
      appliesToTheseConstructs: ["comp-toggle"],
      knownExceptionForThisConcept: "",
    },
  } as Record<string, any>,
};

// --- Lookup tables for rules ---

export const documentationRequirementLevelsTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "rl-must": {
      rowId: "rl-must",
      keyWord: "MUST",
      description: "Absolute requirement.",
      conceptRules: "",
    },
  } as Record<string, any>,
};

export const ruleStatusTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "rs-approved": {
      rowId: "rs-approved",
      name: "Approved",
      description: "Rule is approved.",
      conceptRules: "",
    },
  } as Record<string, any>,
};

export const ruleTypesTable = {
  fetchedAt: "2025-01-01T00:00:00.000Z",
  rows: {
    "rt-specific": {
      rowId: "rt-specific",
      ruleType: "Specific rule",
      description: "A specific rule.",
      conceptRules: "",
    },
  } as Record<string, any>,
};

// --- Helper to build a full RawData object ---

export function buildRawData(overrides?: Partial<RawData>): RawData {
  const base = {
    construct: structuredClone(constructTable) as any,
    constructProperties: structuredClone(constructPropertiesTable) as any,
    constructAnatomy: structuredClone(constructAnatomyTable) as any,
    constructTypes: structuredClone(constructTypesTable) as any,
    constructPropertyTypes: structuredClone(constructPropertyTypesTable) as any,
    documentationChangelog: structuredClone(documentationChangelogTable) as any,
    documentationDecisionlog: structuredClone(documentationDecisionlogTable) as any,
    documentationStatus: structuredClone(documentationStatusTable) as any,
    documentationTiers: structuredClone(documentationTiersTable) as any,
    documentationEditors: structuredClone(documentationEditorsTable) as any,
    concepts: structuredClone(conceptsTable) as any,
    rules: structuredClone(rulesTable) as any,
    conceptTypes: structuredClone(conceptTypesTable) as any,
    documentationRequirementLevels: structuredClone(documentationRequirementLevelsTable) as any,
    ruleStatus: structuredClone(ruleStatusTable) as any,
    ruleTypes: structuredClone(ruleTypesTable) as any,
  };
  return { ...base, ...overrides };
}
