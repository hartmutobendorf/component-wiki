import { describe, it, expect } from "vitest";
import {
  // Raw schemas
  rawComponentRowSchema,
  rawPropertyRowSchema,
  rawAnatomyRowSchema,
  rawChangeLogRowSchema,
  rawDecisionLogRowSchema,
  rawLookupRowSchema,
  rawComponentsTableSchema,
  rawPropertiesTableSchema,
  rawAnatomyTableSchema,
  rawChangeLogTableSchema,
  rawDecisionLogTableSchema,
  rawLookupTableSchema,
  // Output schemas
  componentSchema,
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

// ── rawComponentRowSchema ───────────────────────────────────

describe("rawComponentRowSchema", () => {
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
  };

  it("accepts a valid component row", () => {
    expect(() => rawComponentRowSchema.parse(validRow)).not.toThrow();
  });

  it("accepts componentExampleImage as string", () => {
    const result = rawComponentRowSchema.parse(validRow);
    expect(result.componentExampleImage).toBe("img.png");
  });

  it("accepts componentExampleImage as array of strings", () => {
    const row = { ...validRow, componentExampleImage: ["a.png", "b.png"] };
    const result = rawComponentRowSchema.parse(row);
    expect(result.componentExampleImage).toEqual(["a.png", "b.png"]);
  });

  it("accepts anatomyImage as string", () => {
    const result = rawComponentRowSchema.parse(validRow);
    expect(result.anatomyImage).toBe("anat.png");
  });

  it("accepts anatomyImage as array of strings", () => {
    const row = { ...validRow, anatomyImage: ["x.png"] };
    const result = rawComponentRowSchema.parse(row);
    expect(result.anatomyImage).toEqual(["x.png"]);
  });

  it("accepts uiBlocksUsedInPattern as string", () => {
    const result = rawComponentRowSchema.parse(validRow);
    expect(result.uiBlocksUsedInPattern).toBe("");
  });

  it("accepts uiBlocksUsedInPattern as array of strings", () => {
    const row = { ...validRow, uiBlocksUsedInPattern: ["block-1"] };
    const result = rawComponentRowSchema.parse(row);
    expect(result.uiBlocksUsedInPattern).toEqual(["block-1"]);
  });

  it("allows extra fields via passthrough", () => {
    const row = { ...validRow, extraField: "hello" };
    const result = rawComponentRowSchema.parse(row);
    expect((result as any).extraField).toBe("hello");
  });

  it("rejects missing required fields", () => {
    const { name, ...incomplete } = validRow;
    expect(() => rawComponentRowSchema.parse(incomplete)).toThrow();
  });
});

// ── rawPropertyRowSchema ────────────────────────────────────

describe("rawPropertyRowSchema", () => {
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
    expect(() => rawPropertyRowSchema.parse(validRow)).not.toThrow();
  });

  it("accepts defaultOption as string", () => {
    const result = rawPropertyRowSchema.parse(validRow);
    expect(result.defaultOption).toBe("false");
  });

  it("accepts defaultOption as boolean", () => {
    const row = { ...validRow, defaultOption: true };
    const result = rawPropertyRowSchema.parse(row);
    expect(result.defaultOption).toBe(true);
  });

  it("rejects defaultOption as number", () => {
    const row = { ...validRow, defaultOption: 42 };
    expect(() => rawPropertyRowSchema.parse(row)).toThrow();
  });

  it("rejects when required is not boolean", () => {
    const row = { ...validRow, required: "yes" };
    expect(() => rawPropertyRowSchema.parse(row)).toThrow();
  });
});

// ── rawAnatomyRowSchema ─────────────────────────────────────

describe("rawAnatomyRowSchema", () => {
  const validRow = {
    rowId: "anat-01",
    number: 1,
    name: "Container",
    description: "The outer wrapper.",
    component: "comp-01",
  };

  it("accepts a valid anatomy row", () => {
    expect(() => rawAnatomyRowSchema.parse(validRow)).not.toThrow();
  });

  it("coerces string number to number", () => {
    const row = { ...validRow, number: "3" };
    const result = rawAnatomyRowSchema.parse(row);
    expect(result.number).toBe(3);
  });

  it("coerces numeric string '0' to 0", () => {
    const row = { ...validRow, number: "0" };
    const result = rawAnatomyRowSchema.parse(row);
    expect(result.number).toBe(0);
  });
});

// ── rawChangeLogRowSchema ───────────────────────────────────

describe("rawChangeLogRowSchema", () => {
  it("accepts a valid changelog row", () => {
    const row = {
      rowId: "cl-01",
      construct: "comp-01",
      when: "2025-01-01",
      what: "Initial draft",
      who: "ed-01",
      concept: "",
    };
    expect(() => rawChangeLogRowSchema.parse(row)).not.toThrow();
  });
});

// ── rawDecisionLogRowSchema ─────────────────────────────────

describe("rawDecisionLogRowSchema", () => {
  it("accepts a valid decision log row", () => {
    const row = {
      rowId: "dl-01",
      construct: "comp-01",
      where: "Design review",
      what: "Use variant A",
      link: "https://example.com",
      concept: "",
      when: "",
    };
    expect(() => rawDecisionLogRowSchema.parse(row)).not.toThrow();
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
  it("rawComponentsTableSchema validates table structure", () => {
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
        },
      },
    };
    expect(() => rawComponentsTableSchema.parse(table)).not.toThrow();
  });

  it("rawPropertiesTableSchema validates table structure", () => {
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
    expect(() => rawPropertiesTableSchema.parse(table)).not.toThrow();
  });

  it("rawAnatomyTableSchema validates table structure", () => {
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
    expect(() => rawAnatomyTableSchema.parse(table)).not.toThrow();
  });

  it("rawChangeLogTableSchema validates table structure", () => {
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
        },
      },
    };
    expect(() => rawChangeLogTableSchema.parse(table)).not.toThrow();
  });

  it("rawDecisionLogTableSchema validates table structure", () => {
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
        },
      },
    };
    expect(() => rawDecisionLogTableSchema.parse(table)).not.toThrow();
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

// ── componentSchema ─────────────────────────────────────────

describe("componentSchema", () => {
  const validComponent = {
    name: "Button",
    slug: "button",
    type: "Component",
    tiers: "Global",
    documentationStatus: "All good",
    lastEdited: "2025-01-01",
  };

  it("accepts a minimal valid component", () => {
    const result = componentSchema.parse(validComponent);
    expect(result.name).toBe("Button");
    expect(result.slug).toBe("button");
  });

  it("applies default values for optional fields", () => {
    const result = componentSchema.parse(validComponent);
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
        componentSchema.parse({ ...validComponent, type }),
      ).not.toThrow();
    }
  });

  it("rejects invalid type value", () => {
    expect(() =>
      componentSchema.parse({ ...validComponent, type: "Widget" }),
    ).toThrow();
  });

  it("accepts all valid tiers enum values", () => {
    const tiers = ["Global", "Sites", "Apps"];
    for (const tier of tiers) {
      expect(() =>
        componentSchema.parse({ ...validComponent, tiers: tier }),
      ).not.toThrow();
    }
  });

  it("rejects invalid tiers value", () => {
    expect(() =>
      componentSchema.parse({ ...validComponent, tiers: "Local" }),
    ).toThrow();
  });

  it("accepts all valid documentationStatus enum values", () => {
    const statuses = ["All good", "Minimal", "Unclear", "Needs work"];
    for (const status of statuses) {
      expect(() =>
        componentSchema.parse({
          ...validComponent,
          documentationStatus: status,
        }),
      ).not.toThrow();
    }
  });

  it("rejects invalid documentationStatus value", () => {
    expect(() =>
      componentSchema.parse({
        ...validComponent,
        documentationStatus: "Perfect",
      }),
    ).toThrow();
  });

  it("accepts component with full anatomy", () => {
    const comp = {
      ...validComponent,
      anatomy: {
        image: "img.png",
        table: [{ number: 1, name: "Part", description: "Desc" }],
      },
    };
    const result = componentSchema.parse(comp);
    expect(result.anatomy).toBeDefined();
    expect(result.anatomy!.table).toHaveLength(1);
  });

  it("accepts component with childProperties", () => {
    const comp = {
      ...validComponent,
      childProperties: [
        {
          name: "Toggle",
          properties: [{ name: "checked", type: "boolean" }],
        },
      ],
    };
    const result = componentSchema.parse(comp);
    expect(result.childProperties).toHaveLength(1);
  });

  it("rejects component missing required name", () => {
    const { name, ...incomplete } = validComponent;
    expect(() => componentSchema.parse(incomplete)).toThrow();
  });

  it("rejects component missing required slug", () => {
    const { slug, ...incomplete } = validComponent;
    expect(() => componentSchema.parse(incomplete)).toThrow();
  });

  it("accepts component with mentionedIn", () => {
    const comp = {
      ...validComponent,
      mentionedIn: [
        { name: "Accordion", slug: "accordion" },
        { name: "Form placement", slug: "form-placement" },
      ],
    };
    const result = componentSchema.parse(comp);
    expect(result.mentionedIn).toHaveLength(2);
    expect(result.mentionedIn[0].name).toBe("Accordion");
    expect(result.mentionedIn[1].slug).toBe("form-placement");
  });
});
