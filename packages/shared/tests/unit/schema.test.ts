import { describe, it, expect } from "vitest";
import {
  // Raw schemas
  rawConstructRowSchema,
  rawConstructPropertyRowSchema,
  rawConstructAnatomyRowSchema,
  rawDocumentationChangelogRowSchema,
  rawDocumentationDecisionlogRowSchema,
  rawDocumentationStatusRowSchema,
  rawConstructTypeRowSchema,
  rawDocumentationTierRowSchema,
  rawDocumentationEditorRowSchema,
  rawConstructPropertyTypeRowSchema,
  rawConceptRowSchema,
  rawRuleRowSchema,
  rawConceptTypeRowSchema,
  rawDocumentationRequirementLevelRowSchema,
  rawRuleStatusRowSchema,
  rawRuleTypeRowSchema,
  rawLookupRowSchema,
  rawConstructTableSchema,
  rawConstructPropertiesTableSchema,
  rawConstructAnatomyTableSchema,
  rawDocumentationChangelogTableSchema,
  rawDocumentationDecisionlogTableSchema,
  rawDocumentationStatusTableSchema,
  rawConstructTypesTableSchema,
  rawDocumentationTiersTableSchema,
  rawDocumentationEditorsTableSchema,
  rawConstructPropertyTypesTableSchema,
  rawConceptsTableSchema,
  rawRulesTableSchema,
  rawConceptTypesTableSchema,
  rawDocumentationRequirementLevelsTableSchema,
  rawRuleStatusTableSchema,
  rawRuleTypesTableSchema,
  rawLookupTableSchema,
  // Output schemas
  constructSchema,
  conceptSchema,
  ruleSchema,
  propertySchema,
  anatomyPartSchema,
  anatomySchema,
  changeLogEntrySchema,
  decisionLogEntrySchema,
  childPropertyGroupSchema,
  mentionedInEntrySchema,
} from "../../src/schema.js";

// ══════════════════════════════════════════════════════════════
// Raw schemas
// ══════════════════════════════════════════════════════════════

// ── rawConstructRowSchema ───────────────────────────────────

describe("rawConstructRowSchema", () => {
  const validRow = {
    rowId: "comp-01",
    name: "Button",
    type: "type-01",
    tiers: "tier-01",
    documentationStatus: "status-01",
    lastEdited: "2025-01-01",
    description: "A button.",
    usage: "Click it.",
    examples: "",
    interactions: "",
    figma: "",
    code: "",
    figmaComponentData: "",
    componentExampleImage: "img.png",
    anatomyImage: "anat.png",
    properties: ["p1"],
    anatomy: ["a1"],
    changeLog: ["cl1"],
    decisionLog: ["dl1"],
    uiBlocksUsedInPattern: "",
    "sites-ArchitectureLevels": "",
    appliedRule: [],
    exceptionFromRule: [],
  };

  it("accepts a valid construct row", () => {
    expect(() => rawConstructRowSchema.parse(validRow)).not.toThrow();
  });

  it("accepts componentExampleImage as string", () => {
    const result = rawConstructRowSchema.parse(validRow);
    expect(result.componentExampleImage).toBe("img.png");
  });

  it("accepts componentExampleImage as array of strings", () => {
    const row = { ...validRow, componentExampleImage: ["a.png", "b.png"] };
    const result = rawConstructRowSchema.parse(row);
    expect(result.componentExampleImage).toEqual(["a.png", "b.png"]);
  });

  it("accepts anatomyImage as string", () => {
    const result = rawConstructRowSchema.parse(validRow);
    expect(result.anatomyImage).toBe("anat.png");
  });

  it("accepts anatomyImage as array of strings", () => {
    const row = { ...validRow, anatomyImage: ["x.png"] };
    const result = rawConstructRowSchema.parse(row);
    expect(result.anatomyImage).toEqual(["x.png"]);
  });

  it("accepts uiBlocksUsedInPattern as string", () => {
    const result = rawConstructRowSchema.parse(validRow);
    expect(result.uiBlocksUsedInPattern).toBe("");
  });

  it("accepts uiBlocksUsedInPattern as array of strings", () => {
    const row = { ...validRow, uiBlocksUsedInPattern: ["block-1"] };
    const result = rawConstructRowSchema.parse(row);
    expect(result.uiBlocksUsedInPattern).toEqual(["block-1"]);
  });

  it("accepts appliedRule and exceptionFromRule as arrays", () => {
    const row = { ...validRow, appliedRule: ["r1", "r2"], exceptionFromRule: ["r3"] };
    const result = rawConstructRowSchema.parse(row);
    expect(result.appliedRule).toEqual(["r1", "r2"]);
    expect(result.exceptionFromRule).toEqual(["r3"]);
  });

  it("allows extra fields via passthrough", () => {
    const row = { ...validRow, extraField: "hello" };
    const result = rawConstructRowSchema.parse(row);
    expect((result as any).extraField).toBe("hello");
  });

  it("rejects missing required fields", () => {
    const { name, ...incomplete } = validRow;
    expect(() => rawConstructRowSchema.parse(incomplete)).toThrow();
  });
});

// ── rawConstructPropertyRowSchema ───────────────────────────

describe("rawConstructPropertyRowSchema", () => {
  const validRow = {
    rowId: "prop-01",
    name: "disabled",
    required: false,
    type: "pt-bool",
    description: "Disables the element.",
    constraint: "",
    options: "",
    defaultOption: "false",
    component: ["comp-01"],
  };

  it("accepts a valid property row", () => {
    expect(() => rawConstructPropertyRowSchema.parse(validRow)).not.toThrow();
  });

  it("accepts defaultOption as string", () => {
    const result = rawConstructPropertyRowSchema.parse(validRow);
    expect(result.defaultOption).toBe("false");
  });

  it("accepts defaultOption as boolean", () => {
    const row = { ...validRow, defaultOption: true };
    const result = rawConstructPropertyRowSchema.parse(row);
    expect(result.defaultOption).toBe(true);
  });

  it("rejects defaultOption as number", () => {
    const row = { ...validRow, defaultOption: 42 };
    expect(() => rawConstructPropertyRowSchema.parse(row)).toThrow();
  });

  it("rejects when required is not boolean", () => {
    const row = { ...validRow, required: "yes" };
    expect(() => rawConstructPropertyRowSchema.parse(row)).toThrow();
  });
});

// ── rawConstructAnatomyRowSchema ────────────────────────────

describe("rawConstructAnatomyRowSchema", () => {
  const validRow = {
    rowId: "anat-01",
    number: 1,
    name: "Container",
    description: "The outer wrapper.",
    component: "comp-01",
  };

  it("accepts a valid anatomy row", () => {
    expect(() => rawConstructAnatomyRowSchema.parse(validRow)).not.toThrow();
  });

  it("coerces string number to number", () => {
    const row = { ...validRow, number: "3" };
    const result = rawConstructAnatomyRowSchema.parse(row);
    expect(result.number).toBe(3);
  });

  it("coerces numeric string '0' to 0", () => {
    const row = { ...validRow, number: "0" };
    const result = rawConstructAnatomyRowSchema.parse(row);
    expect(result.number).toBe(0);
  });
});

// ── rawDocumentationChangelogRowSchema ──────────────────────

describe("rawDocumentationChangelogRowSchema", () => {
  it("accepts a valid changelog row", () => {
    const row = {
      rowId: "cl-01",
      construct: "comp-01",
      when: "2025-01-01",
      what: "Initial draft",
      who: "ed-01",
      concept: "",
      rules: "",
    };
    expect(() => rawDocumentationChangelogRowSchema.parse(row)).not.toThrow();
  });

  it("includes the rules field", () => {
    const row = {
      rowId: "cl-01",
      construct: "comp-01",
      when: "2025-01-01",
      what: "Added rules",
      who: "ed-01",
      concept: "",
      rules: "rule-01",
    };
    const result = rawDocumentationChangelogRowSchema.parse(row);
    expect(result.rules).toBe("rule-01");
  });
});

// ── rawDocumentationDecisionlogRowSchema ────────────────────

describe("rawDocumentationDecisionlogRowSchema", () => {
  it("accepts a valid decision log row", () => {
    const row = {
      rowId: "dl-01",
      construct: "comp-01",
      where: "Design review",
      what: "Use variant A",
      link: "https://example.com",
      concept: "",
      when: "",
      rules: "",
    };
    expect(() => rawDocumentationDecisionlogRowSchema.parse(row)).not.toThrow();
  });

  it("includes the rules field", () => {
    const row = {
      rowId: "dl-01",
      construct: "comp-01",
      where: "Design review",
      what: "Use variant A",
      link: "https://example.com",
      concept: "",
      when: "",
      rules: "rule-01",
    };
    const result = rawDocumentationDecisionlogRowSchema.parse(row);
    expect(result.rules).toBe("rule-01");
  });
});

// ── rawDocumentationStatusRowSchema ─────────────────────────

describe("rawDocumentationStatusRowSchema", () => {
  it("accepts a valid documentation status row", () => {
    const row = {
      rowId: "stat-01",
      name: "Draft",
      components: ["comp-01"],
      description: "Needs more work",
      concepts: ["conc-01"],
    };
    expect(() => rawDocumentationStatusRowSchema.parse(row)).not.toThrow();
  });

  it("includes concepts array", () => {
    const row = {
      rowId: "stat-01",
      name: "Draft",
      components: [],
      description: "",
      concepts: ["conc-01", "conc-02"],
    };
    const result = rawDocumentationStatusRowSchema.parse(row);
    expect(result.concepts).toEqual(["conc-01", "conc-02"]);
  });
});

// ── rawConstructTypeRowSchema ───────────────────────────────

describe("rawConstructTypeRowSchema", () => {
  it("accepts a valid construct type row", () => {
    const row = {
      rowId: "type-01",
      name: "Component",
      components: ["comp-01"],
      description: "A UI component",
    };
    expect(() => rawConstructTypeRowSchema.parse(row)).not.toThrow();
  });
});

// ── rawDocumentationTierRowSchema ───────────────────────────

describe("rawDocumentationTierRowSchema", () => {
  it("accepts a valid tier row", () => {
    const row = {
      rowId: "tier-01",
      name: "Global",
      components: ["comp-01"],
      text: "Used everywhere",
      concepts: ["conc-01"],
    };
    expect(() => rawDocumentationTierRowSchema.parse(row)).not.toThrow();
  });

  it("includes concepts array", () => {
    const row = {
      rowId: "tier-01",
      name: "Global",
      components: [],
      text: "",
      concepts: ["conc-01"],
    };
    const result = rawDocumentationTierRowSchema.parse(row);
    expect(result.concepts).toEqual(["conc-01"]);
  });
});

// ── rawDocumentationEditorRowSchema ─────────────────────────

describe("rawDocumentationEditorRowSchema", () => {
  it("accepts a valid editor row", () => {
    const row = {
      rowId: "ed-01",
      name: "Alice",
      changelog: ["cl-01"],
    };
    expect(() => rawDocumentationEditorRowSchema.parse(row)).not.toThrow();
  });
});

// ── rawConstructPropertyTypeRowSchema ───────────────────────

describe("rawConstructPropertyTypeRowSchema", () => {
  it("accepts a valid property type row", () => {
    const row = {
      rowId: "pt-01",
      name: "boolean",
      properties: ["prop-01"],
      sitesPatternProperties: "",
    };
    expect(() => rawConstructPropertyTypeRowSchema.parse(row)).not.toThrow();
  });
});

// ── rawConceptRowSchema ─────────────────────────────────────

describe("rawConceptRowSchema", () => {
  const validRow = {
    rowId: "conc-01",
    name: "Site",
    type: "ct-01",
    documentationStatus: "stat-01",
    tier: "tier-01",
    description: "The complete web property.",
    content: "Some markdown content",
    lastEdited: "2026-02-18T09:29:54.400+00:00",
    decisionlog: [],
    changelog: [],
    appliedRule: ["r1"],
    exceptedFromRule: [],
  };

  it("accepts a valid concept row", () => {
    expect(() => rawConceptRowSchema.parse(validRow)).not.toThrow();
  });

  it("accepts concept with applied rules", () => {
    const result = rawConceptRowSchema.parse(validRow);
    expect(result.appliedRule).toEqual(["r1"]);
  });

  it("allows extra fields via passthrough", () => {
    const row = { ...validRow, extra: true };
    const result = rawConceptRowSchema.parse(row);
    expect((result as any).extra).toBe(true);
  });

  it("rejects missing required fields", () => {
    const { name, ...incomplete } = validRow;
    expect(() => rawConceptRowSchema.parse(incomplete)).toThrow();
  });
});

// ── rawRuleRowSchema ────────────────────────────────────────

describe("rawRuleRowSchema", () => {
  const validRow = {
    rowId: "rule-01",
    rule: "Dividers must separate sections.",
    knownExceptionForThisConstruct: "",
    appliesToTheseConcepts: ["conc-01"],
    ruleStrength: ["rl-01"],
    status: ["rs-01"],
    type: ["rt-01"],
    lastEdited: "2026-02-18T09:35:07.035+00:00",
    changelog: [],
    decisionlog: [],
    appliesToTheseConstructs: "",
    knownExceptionForThisConcept: "",
  };

  it("accepts a valid rule row", () => {
    expect(() => rawRuleRowSchema.parse(validRow)).not.toThrow();
  });

  it("accepts rule with multiple lookup arrays", () => {
    const row = {
      ...validRow,
      ruleStrength: ["rl-01", "rl-02"],
      status: ["rs-01"],
      type: ["rt-01", "rt-02"],
    };
    const result = rawRuleRowSchema.parse(row);
    expect(result.ruleStrength).toEqual(["rl-01", "rl-02"]);
    expect(result.type).toEqual(["rt-01", "rt-02"]);
  });

  it("rejects missing required fields", () => {
    const { rule, ...incomplete } = validRow;
    expect(() => rawRuleRowSchema.parse(incomplete)).toThrow();
  });
});

// ── rawConceptTypeRowSchema ─────────────────────────────────

describe("rawConceptTypeRowSchema", () => {
  it("accepts a valid concept type row", () => {
    const row = {
      rowId: "ct-01",
      name: "Decision guide",
      concepts: ["conc-01"],
      description: "When to choose X over Y",
    };
    expect(() => rawConceptTypeRowSchema.parse(row)).not.toThrow();
  });
});

// ── rawDocumentationRequirementLevelRowSchema ────────────────

describe("rawDocumentationRequirementLevelRowSchema", () => {
  it("accepts a valid requirement level row", () => {
    const row = {
      rowId: "rl-01",
      keyWord: "MUST",
      description: "Absolute requirement",
      conceptRules: "",
    };
    expect(() => rawDocumentationRequirementLevelRowSchema.parse(row)).not.toThrow();
  });

  it("accepts conceptRules as string", () => {
    const row = {
      rowId: "rl-01",
      keyWord: "MUST",
      description: "",
      conceptRules: "",
    };
    const result = rawDocumentationRequirementLevelRowSchema.parse(row);
    expect(result.conceptRules).toBe("");
  });

  it("accepts conceptRules as array of strings", () => {
    const row = {
      rowId: "rl-01",
      keyWord: "MUST",
      description: "",
      conceptRules: ["rule-01", "rule-02"],
    };
    const result = rawDocumentationRequirementLevelRowSchema.parse(row);
    expect(result.conceptRules).toEqual(["rule-01", "rule-02"]);
  });
});

// ── rawRuleStatusRowSchema ──────────────────────────────────

describe("rawRuleStatusRowSchema", () => {
  it("accepts a valid rule status row", () => {
    const row = {
      rowId: "rs-01",
      name: "Accepted",
      description: "Rule is accepted",
      conceptRules: ["rule-01"],
    };
    expect(() => rawRuleStatusRowSchema.parse(row)).not.toThrow();
  });
});

// ── rawRuleTypeRowSchema ────────────────────────────────────

describe("rawRuleTypeRowSchema", () => {
  it("accepts a valid rule type row", () => {
    const row = {
      rowId: "rt-01",
      ruleType: "Design principle",
      description: "",
      conceptRules: ["rule-01"],
    };
    expect(() => rawRuleTypeRowSchema.parse(row)).not.toThrow();
  });
});

// ── rawLookupRowSchema ──────────────────────────────────────

describe("rawLookupRowSchema", () => {
  it("accepts a valid lookup row", () => {
    const row = { rowId: "type-01", name: "Component" };
    const result = rawLookupRowSchema.parse(row);
    expect(result.name).toBe("Component");
  });

  it("allows extra fields via passthrough", () => {
    const row = { rowId: "type-01", name: "Component", extra: true };
    const result = rawLookupRowSchema.parse(row);
    expect((result as any).extra).toBe(true);
  });
});

// ── Raw table schemas ───────────────────────────────────────

describe("raw table schemas", () => {
  it("rawConstructTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "comp-01": {
          rowId: "comp-01",
          name: "Button",
          type: "t",
          tiers: "t",
          documentationStatus: "s",
          lastEdited: "",
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
      },
    };
    expect(() => rawConstructTableSchema.parse(table)).not.toThrow();
  });

  it("rawConstructPropertiesTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "prop-01": {
          rowId: "prop-01",
          name: "disabled",
          required: false,
          type: "pt-bool",
          description: "",
          constraint: "",
          options: "",
          defaultOption: "",
          component: [],
        },
      },
    };
    expect(() => rawConstructPropertiesTableSchema.parse(table)).not.toThrow();
  });

  it("rawConstructAnatomyTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "anat-01": {
          rowId: "anat-01",
          number: 1,
          name: "Track",
          description: "",
          component: "comp-01",
        },
      },
    };
    expect(() => rawConstructAnatomyTableSchema.parse(table)).not.toThrow();
  });

  it("rawDocumentationChangelogTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "cl-01": {
          rowId: "cl-01",
          construct: "comp-01",
          when: "",
          what: "",
          who: "",
          concept: "",
          rules: "",
        },
      },
    };
    expect(() => rawDocumentationChangelogTableSchema.parse(table)).not.toThrow();
  });

  it("rawDocumentationDecisionlogTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "dl-01": {
          rowId: "dl-01",
          construct: "comp-01",
          where: "",
          what: "",
          link: "",
          concept: "",
          when: "",
          rules: "",
        },
      },
    };
    expect(() => rawDocumentationDecisionlogTableSchema.parse(table)).not.toThrow();
  });

  it("rawDocumentationStatusTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "stat-01": {
          rowId: "stat-01",
          name: "Draft",
          components: [],
          description: "",
          concepts: [],
        },
      },
    };
    expect(() => rawDocumentationStatusTableSchema.parse(table)).not.toThrow();
  });

  it("rawConstructTypesTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "type-01": {
          rowId: "type-01",
          name: "Component",
          components: [],
          description: "",
        },
      },
    };
    expect(() => rawConstructTypesTableSchema.parse(table)).not.toThrow();
  });

  it("rawDocumentationTiersTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "tier-01": {
          rowId: "tier-01",
          name: "Global",
          components: [],
          text: "",
          concepts: [],
        },
      },
    };
    expect(() => rawDocumentationTiersTableSchema.parse(table)).not.toThrow();
  });

  it("rawDocumentationEditorsTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "ed-01": { rowId: "ed-01", name: "Alice", changelog: [] },
      },
    };
    expect(() => rawDocumentationEditorsTableSchema.parse(table)).not.toThrow();
  });

  it("rawConstructPropertyTypesTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "pt-01": {
          rowId: "pt-01",
          name: "boolean",
          properties: [],
          sitesPatternProperties: "",
        },
      },
    };
    expect(() => rawConstructPropertyTypesTableSchema.parse(table)).not.toThrow();
  });

  it("rawConceptsTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "conc-01": {
          rowId: "conc-01",
          name: "Site",
          type: "ct-01",
          documentationStatus: "stat-01",
          tier: "tier-01",
          description: "",
          content: "",
          lastEdited: "",
          decisionlog: [],
          changelog: [],
          appliedRule: [],
          exceptedFromRule: [],
        },
      },
    };
    expect(() => rawConceptsTableSchema.parse(table)).not.toThrow();
  });

  it("rawRulesTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "rule-01": {
          rowId: "rule-01",
          rule: "Sections must be separated.",
          knownExceptionForThisConstruct: "",
          appliesToTheseConcepts: [],
          ruleStrength: [],
          status: [],
          type: [],
          lastEdited: "",
          changelog: [],
          decisionlog: [],
          appliesToTheseConstructs: "",
          knownExceptionForThisConcept: "",
        },
      },
    };
    expect(() => rawRulesTableSchema.parse(table)).not.toThrow();
  });

  it("rawConceptTypesTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "ct-01": {
          rowId: "ct-01",
          name: "Decision guide",
          concepts: [],
          description: "",
        },
      },
    };
    expect(() => rawConceptTypesTableSchema.parse(table)).not.toThrow();
  });

  it("rawDocumentationRequirementLevelsTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "rl-01": {
          rowId: "rl-01",
          keyWord: "MUST",
          description: "",
          conceptRules: "",
        },
      },
    };
    expect(() => rawDocumentationRequirementLevelsTableSchema.parse(table)).not.toThrow();
  });

  it("rawRuleStatusTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "rs-01": {
          rowId: "rs-01",
          name: "Accepted",
          description: "",
          conceptRules: [],
        },
      },
    };
    expect(() => rawRuleStatusTableSchema.parse(table)).not.toThrow();
  });

  it("rawRuleTypesTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "rt-01": {
          rowId: "rt-01",
          ruleType: "Design principle",
          description: "",
          conceptRules: [],
        },
      },
    };
    expect(() => rawRuleTypesTableSchema.parse(table)).not.toThrow();
  });

  it("rawLookupTableSchema validates table structure", () => {
    const table = {
      fetchedAt: "2025-01-01T00:00:00.000Z",
      rows: {
        "lk-01": { rowId: "lk-01", name: "Global" },
      },
    };
    expect(() => rawLookupTableSchema.parse(table)).not.toThrow();
  });

  it("rejects table without fetchedAt", () => {
    const table = { rows: {} };
    expect(() => rawLookupTableSchema.parse(table)).toThrow();
  });

  it("rejects table without rows", () => {
    const table = { fetchedAt: "2025-01-01T00:00:00.000Z" };
    expect(() => rawLookupTableSchema.parse(table)).toThrow();
  });
});

// ══════════════════════════════════════════════════════════════
// Output schemas
// ══════════════════════════════════════════════════════════════

// ── propertySchema ──────────────────────────────────────────

describe("propertySchema", () => {
  const validProperty = {
    name: "disabled",
    type: "boolean",
  };

  it("accepts a minimal valid property", () => {
    const result = propertySchema.parse(validProperty);
    expect(result.name).toBe("disabled");
    expect(result.type).toBe("boolean");
  });

  it("applies default values for optional fields", () => {
    const result = propertySchema.parse(validProperty);
    expect(result.description).toBe("");
    expect(result.constraint).toBe("");
    expect(result.defaultOption).toBe("");
  });

  it("accepts all valid type enum values", () => {
    const types = [
      "boolean",
      "string",
      "number",
      "single select",
      "multi select",
      "slot",
      "object",
      "callback",
    ];
    for (const type of types) {
      expect(() =>
        propertySchema.parse({ name: "test", type }),
      ).not.toThrow();
    }
  });

  it("rejects invalid type value", () => {
    expect(() =>
      propertySchema.parse({ name: "test", type: "invalid" }),
    ).toThrow();
  });

  it("accepts options as array of strings", () => {
    const prop = { ...validProperty, options: ["a", "b", "c"] };
    const result = propertySchema.parse(prop);
    expect(result.options).toEqual(["a", "b", "c"]);
  });
});

// ── anatomyPartSchema ───────────────────────────────────────

describe("anatomyPartSchema", () => {
  it("accepts a valid anatomy part", () => {
    const part = { number: 1, name: "Container", description: "Outer wrap" };
    const result = anatomyPartSchema.parse(part);
    expect(result.number).toBe(1);
    expect(result.name).toBe("Container");
  });

  it("rejects missing number", () => {
    expect(() =>
      anatomyPartSchema.parse({ name: "X", description: "Y" }),
    ).toThrow();
  });
});

// ── anatomySchema ───────────────────────────────────────────

describe("anatomySchema", () => {
  it("applies defaults for empty anatomy", () => {
    const result = anatomySchema.parse({});
    expect(result.image).toBe("");
    expect(result.table).toEqual([]);
  });

  it("accepts anatomy with image and table", () => {
    const anatomy = {
      image: "img.png",
      table: [{ number: 1, name: "Part", description: "Desc" }],
    };
    const result = anatomySchema.parse(anatomy);
    expect(result.image).toBe("img.png");
    expect(result.table).toHaveLength(1);
  });
});

// ── changeLogEntrySchema ────────────────────────────────────

describe("changeLogEntrySchema", () => {
  it("accepts a valid changelog entry", () => {
    const entry = { who: "Alice", when: "2025-01-01", what: "Created" };
    expect(() => changeLogEntrySchema.parse(entry)).not.toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => changeLogEntrySchema.parse({ who: "Alice" })).toThrow();
  });
});

// ── decisionLogEntrySchema ──────────────────────────────────

describe("decisionLogEntrySchema", () => {
  it("accepts a valid decision log entry", () => {
    const entry = {
      where: "Meeting",
      what: "Use variant A",
      link: "https://example.com",
      when: "2025-01-01",
    };
    expect(() => decisionLogEntrySchema.parse(entry)).not.toThrow();
  });
});

// ── childPropertyGroupSchema ────────────────────────────────

describe("childPropertyGroupSchema", () => {
  it("accepts a valid child property group", () => {
    const group = {
      name: "Button",
      properties: [{ name: "disabled", type: "boolean" }],
    };
    const result = childPropertyGroupSchema.parse(group);
    expect(result.name).toBe("Button");
    expect(result.properties).toHaveLength(1);
  });

  it("accepts empty properties array", () => {
    const group = { name: "Empty", properties: [] };
    const result = childPropertyGroupSchema.parse(group);
    expect(result.properties).toEqual([]);
  });
});

// ── mentionedInEntrySchema ───────────────────────────────────

describe("mentionedInEntrySchema", () => {
  it("accepts a valid mentioned-in entry", () => {
    const entry = { name: "Accordion", slug: "accordion" };
    const result = mentionedInEntrySchema.parse(entry);
    expect(result.name).toBe("Accordion");
    expect(result.slug).toBe("accordion");
  });

  it("rejects missing name", () => {
    expect(() => mentionedInEntrySchema.parse({ slug: "accordion" })).toThrow();
  });

  it("rejects missing slug", () => {
    expect(() => mentionedInEntrySchema.parse({ name: "Accordion" })).toThrow();
  });
});

// ── constructSchema ─────────────────────────────────────────

describe("constructSchema", () => {
  const validConstruct = {
    name: "Button",
    slug: "button",
    type: "Component",
    tiers: "Global",
    documentationStatus: "All good",
    lastEdited: "2025-01-01",
  };

  it("accepts a minimal valid construct", () => {
    const result = constructSchema.parse(validConstruct);
    expect(result.name).toBe("Button");
    expect(result.slug).toBe("button");
  });

  it("applies default values for optional fields", () => {
    const result = constructSchema.parse(validConstruct);
    expect(result.figmaLink).toBe("");
    expect(result.codeLink).toBe("");
    expect(result.description).toBe("");
    expect(result.usage).toBe("");
    expect(result.examples).toBe("");
    expect(result.figmaComponentData).toBe("");
    expect(result.componentExampleImage).toBe("");
    expect(result.properties).toEqual([]);
    expect(result.changeLog).toEqual([]);
    expect(result.decisionLog).toEqual([]);
    expect(result.appliedRules).toEqual([]);
    expect(result.exceptionFromRules).toEqual([]);
    expect(result.mentionedIn).toEqual([]);
  });

  it("accepts all valid type enum values", () => {
    const types = [
      "Foundation",
      "Component",
      "Complex component",
      "Pattern",
      "Page",
      "Mental model",
      "Layout",
    ];
    for (const type of types) {
      expect(() =>
        constructSchema.parse({ ...validConstruct, type }),
      ).not.toThrow();
    }
  });

  it("rejects invalid type value", () => {
    expect(() =>
      constructSchema.parse({ ...validConstruct, type: "Widget" }),
    ).toThrow();
  });

  it("accepts all valid tiers enum values", () => {
    const tiers = ["Global", "Sites", "Apps"];
    for (const tier of tiers) {
      expect(() =>
        constructSchema.parse({ ...validConstruct, tiers: tier }),
      ).not.toThrow();
    }
  });

  it("rejects invalid tiers value", () => {
    expect(() =>
      constructSchema.parse({ ...validConstruct, tiers: "Local" }),
    ).toThrow();
  });

  it("accepts all valid documentationStatus enum values", () => {
    const statuses = ["All good", "Minimal", "Unclear", "Needs work"];
    for (const status of statuses) {
      expect(() =>
        constructSchema.parse({
          ...validConstruct,
          documentationStatus: status,
        }),
      ).not.toThrow();
    }
  });

  it("rejects invalid documentationStatus value", () => {
    expect(() =>
      constructSchema.parse({
        ...validConstruct,
        documentationStatus: "Perfect",
      }),
    ).toThrow();
  });

  it("accepts construct with full anatomy", () => {
    const comp = {
      ...validConstruct,
      anatomy: {
        image: "img.png",
        table: [{ number: 1, name: "Part", description: "Desc" }],
      },
    };
    const result = constructSchema.parse(comp);
    expect(result.anatomy).toBeDefined();
    expect(result.anatomy!.table).toHaveLength(1);
  });

  it("accepts construct with childProperties", () => {
    const comp = {
      ...validConstruct,
      childProperties: [
        {
          name: "Toggle",
          properties: [{ name: "checked", type: "boolean" }],
        },
      ],
    };
    const result = constructSchema.parse(comp);
    expect(result.childProperties).toHaveLength(1);
  });

  it("accepts construct with appliedRules and exceptionFromRules", () => {
    const comp = {
      ...validConstruct,
      appliedRules: ["rule-01", "rule-02"],
      exceptionFromRules: ["rule-03"],
    };
    const result = constructSchema.parse(comp);
    expect(result.appliedRules).toEqual(["rule-01", "rule-02"]);
    expect(result.exceptionFromRules).toEqual(["rule-03"]);
  });

  it("rejects construct missing required name", () => {
    const { name, ...incomplete } = validConstruct;
    expect(() => constructSchema.parse(incomplete)).toThrow();
  });

  it("rejects construct missing required slug", () => {
    const { slug, ...incomplete } = validConstruct;
    expect(() => constructSchema.parse(incomplete)).toThrow();
  });

  it("accepts construct with mentionedIn", () => {
    const comp = {
      ...validConstruct,
      mentionedIn: [
        { name: "Accordion", slug: "accordion" },
        { name: "Form placement", slug: "form-placement" },
      ],
    };
    const result = constructSchema.parse(comp);
    expect(result.mentionedIn).toHaveLength(2);
    expect(result.mentionedIn[0].name).toBe("Accordion");
    expect(result.mentionedIn[1].slug).toBe("form-placement");
  });
});

// ── conceptSchema ───────────────────────────────────────────

describe("conceptSchema", () => {
  const validConcept = {
    name: "Site",
    slug: "site",
    type: "Decision guide",
    tier: "Global",
    documentationStatus: "All good",
    lastEdited: "2026-02-18",
  };

  it("accepts a minimal valid concept", () => {
    const result = conceptSchema.parse(validConcept);
    expect(result.name).toBe("Site");
    expect(result.slug).toBe("site");
  });

  it("applies default values for optional fields", () => {
    const result = conceptSchema.parse(validConcept);
    expect(result.description).toBe("");
    expect(result.content).toBe("");
    expect(result.changeLog).toEqual([]);
    expect(result.decisionLog).toEqual([]);
    expect(result.appliedRules).toEqual([]);
    expect(result.exceptedFromRules).toEqual([]);
  });

  it("accepts concept with content and rules", () => {
    const concept = {
      ...validConcept,
      content: "Some markdown",
      appliedRules: ["rule-01"],
      exceptedFromRules: ["rule-02"],
    };
    const result = conceptSchema.parse(concept);
    expect(result.content).toBe("Some markdown");
    expect(result.appliedRules).toEqual(["rule-01"]);
    expect(result.exceptedFromRules).toEqual(["rule-02"]);
  });

  it("accepts concept with changelog and decisionlog", () => {
    const concept = {
      ...validConcept,
      changeLog: [{ who: "Alice", when: "2026-01-01", what: "Created" }],
      decisionLog: [{ where: "Meeting", what: "Decision", link: "", when: "" }],
    };
    const result = conceptSchema.parse(concept);
    expect(result.changeLog).toHaveLength(1);
    expect(result.decisionLog).toHaveLength(1);
  });

  it("rejects missing required name", () => {
    const { name, ...incomplete } = validConcept;
    expect(() => conceptSchema.parse(incomplete)).toThrow();
  });

  it("rejects missing required slug", () => {
    const { slug, ...incomplete } = validConcept;
    expect(() => conceptSchema.parse(incomplete)).toThrow();
  });
});

// ── ruleSchema ──────────────────────────────────────────────

describe("ruleSchema", () => {
  const validRule = {
    rule: "Dividers must separate sections.",
    lastEdited: "2026-02-18",
  };

  it("accepts a minimal valid rule", () => {
    const result = ruleSchema.parse(validRule);
    expect(result.rule).toBe("Dividers must separate sections.");
  });

  it("applies default values for optional fields", () => {
    const result = ruleSchema.parse(validRule);
    expect(result.ruleStrength).toBe("");
    expect(result.status).toBe("");
    expect(result.type).toBe("");
    expect(result.appliesToConcepts).toEqual([]);
    expect(result.appliesToConstructs).toEqual([]);
    expect(result.knownExceptionForConstructs).toBe("");
    expect(result.knownExceptionForConcepts).toBe("");
    expect(result.changeLog).toEqual([]);
    expect(result.decisionLog).toEqual([]);
  });

  it("accepts rule with all fields populated", () => {
    const rule = {
      ...validRule,
      ruleStrength: "MUST",
      status: "Accepted",
      type: "Design principle",
      appliesToConcepts: ["Site", "Page"],
      appliesToConstructs: ["Button"],
      knownExceptionForConstructs: "Special case",
      knownExceptionForConcepts: "Edge case",
      changeLog: [{ who: "Alice", when: "2026-01-01", what: "Created" }],
      decisionLog: [{ where: "Review", what: "Accepted", link: "", when: "" }],
    };
    const result = ruleSchema.parse(rule);
    expect(result.appliesToConcepts).toEqual(["Site", "Page"]);
    expect(result.appliesToConstructs).toEqual(["Button"]);
    expect(result.changeLog).toHaveLength(1);
  });

  it("rejects missing required rule field", () => {
    expect(() => ruleSchema.parse({ lastEdited: "2026-01-01" })).toThrow();
  });

  it("rejects missing required lastEdited field", () => {
    expect(() => ruleSchema.parse({ rule: "Some rule" })).toThrow();
  });
});
