import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { denormalize } from "../../src/denormalize.js";
import { componentSchema } from "@wiki/shared";
import {
  buildRawData,
  componentsTable,
  propertiesTable,
  anatomyTable,
  changelogTable,
  decisionLogTable,
  typesTable,
  tiersTable,
  docStatusTable,
  propertyTypesTable,
  editorsTable,
} from "../fixtures/raw-data.js";

// Suppress console.warn in tests (denormalize emits warnings)
let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
});

// ── Basic output ────────────────────────────────────────────

describe("denormalize — basic output", () => {
  it("returns an array of components", () => {
    const result = denormalize(buildRawData());
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters out Block-type components", () => {
    const result = denormalize(buildRawData());
    const names = result.map((c) => c.name);
    expect(names).not.toContain("Internal block");
  });

  it("includes non-Block components", () => {
    const result = denormalize(buildRawData());
    const names = result.map((c) => c.name);
    expect(names).toContain("Button");
    expect(names).toContain("Toggle switch");
    expect(names).toContain("Card pattern");
    expect(names).toContain("Plain component");
  });

  it("all output components pass the componentSchema validation", () => {
    const result = denormalize(buildRawData());
    for (const component of result) {
      const parsed = componentSchema.safeParse(component);
      if (!parsed.success) {
        throw new Error(
          `Component "${component.name}" failed validation: ${parsed.error.message}`,
        );
      }
    }
  });
});

// ── Slug generation ─────────────────────────────────────────

describe("denormalize — slug generation", () => {
  it("generates a lowercase slug from the component name", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.slug).toBe("button");
  });

  it("replaces spaces and special characters with hyphens", () => {
    const result = denormalize(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    expect(toggle.slug).toBe("toggle-switch");
  });

  it("strips leading and trailing hyphens", () => {
    const raw = buildRawData();
    // Add a component with a name that would produce leading/trailing hyphens
    (raw.components.rows as any)["comp-edge"] = {
      rowId: "comp-edge",
      name: "  --Edge case-- ",
      type: "type-component",
      tiers: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "",
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
    };
    const result = denormalize(raw);
    const edge = result.find((c) => c.name === "  --Edge case-- ")!;
    expect(edge.slug).toBe("edge-case");
  });
});

// ── Lookup resolution ───────────────────────────────────────

describe("denormalize — lookup resolution", () => {
  it("resolves type name from lookup table", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.type).toBe("Component");
  });

  it("resolves tier name from lookup table", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.tiers).toBe("Global");
  });

  it("resolves documentation status from lookup table", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.documentationStatus).toBe("All good");
  });

  it("returns empty string for missing lookup rowId", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].tiers = "nonexistent-tier";
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.tiers).toBe("");
  });
});

// ── Scalar fields ───────────────────────────────────────────

describe("denormalize — scalar fields", () => {
  it("maps description, usage, examples from raw row", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.description).toBe(
      "A clickable button for triggering actions.",
    );
    expect(button.usage).toBe(
      "Use buttons for primary and secondary actions.",
    );
    expect(button.examples).toBe(
      "See the design system for usage examples.",
    );
  });

  it("maps figmaLink from figma field", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.figmaLink).toBe(
      "https://www.figma.com/design/abc123/Library",
    );
  });

  it("maps codeLink from code field", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.codeLink).toBe(
      "https://github.com/org/repo/tree/main/button",
    );
  });

  it("defaults missing string fields to empty string", () => {
    const result = denormalize(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    expect(toggle.figmaLink).toBe("");
    expect(toggle.codeLink).toBe("");
    expect(toggle.examples).toBe("");
  });

  it("maps lastEdited from raw row", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.lastEdited).toBe("2025-06-15T10:00:00.000Z");
  });
});

// ── Image resolution ────────────────────────────────────────

describe("denormalize — image resolution", () => {
  it("resolves componentExampleImage from a string", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.componentExampleImage).toBe("images/button-example.png");
  });

  it("resolves componentExampleImage from an array (first element)", () => {
    const result = denormalize(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    expect(toggle.componentExampleImage).toBe("images/toggle-example.png");
  });

  it("returns empty string when componentExampleImage is empty", () => {
    const result = denormalize(buildRawData());
    const pattern = result.find((c) => c.name === "Card pattern")!;
    expect(pattern.componentExampleImage).toBe("");
  });
});

// ── Properties ──────────────────────────────────────────────

describe("denormalize — properties", () => {
  it("joins properties by rowId", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.properties).toHaveLength(3);
    const names = button.properties.map((p) => p.name);
    expect(names).toContain("disabled");
    expect(names).toContain("variant");
    expect(names).toContain("label");
  });

  it("resolves property type via propertyTypes lookup", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    const disabled = button.properties.find((p) => p.name === "disabled")!;
    expect(disabled.type).toBe("boolean");
    const variant = button.properties.find((p) => p.name === "variant")!;
    expect(variant.type).toBe("single select");
  });

  it("maps required field", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    const disabled = button.properties.find((p) => p.name === "disabled")!;
    expect(disabled.required).toBe(false);
    const variant = button.properties.find((p) => p.name === "variant")!;
    expect(variant.required).toBe(true);
  });

  it("parses options from comma-separated string", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    const variant = button.properties.find((p) => p.name === "variant")!;
    expect(variant.options).toEqual(["primary", "secondary", "ghost"]);
  });

  it("omits options key when options is empty", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    const label = button.properties.find((p) => p.name === "label")!;
    expect(label.options).toBeUndefined();
  });

  it("maps defaultOption", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    const variant = button.properties.find((p) => p.name === "variant")!;
    expect(variant.defaultOption).toBe("primary");
  });

  it("converts boolean defaultOption to string", () => {
    const result = denormalize(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    const checked = toggle.properties.find((p) => p.name === "checked")!;
    expect(checked.defaultOption).toBe("false");
  });

  it("maps description and constraint", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    const disabled = button.properties.find((p) => p.name === "disabled")!;
    expect(disabled.description).toBe("Prevents user interaction.");
    expect(disabled.constraint).toBe("Must be true or false");
  });

  it("defaults to 'string' type for unknown property type", () => {
    const raw = buildRawData();
    (raw.properties.rows as any)["prop-disabled"].type = "pt-unknown";
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    const disabled = button.properties.find((p) => p.name === "disabled")!;
    expect(disabled.type).toBe("string");
  });

  it("returns empty properties for component with no property refs", () => {
    const result = denormalize(buildRawData());
    const plain = result.find((c) => c.name === "Plain component")!;
    expect(plain.properties).toEqual([]);
  });

  it("warns and skips missing property rowIds", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].properties = [
      "prop-disabled",
      "prop-nonexistent",
    ];
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.properties).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalled();
  });
});

// ── Anatomy ─────────────────────────────────────────────────

describe("denormalize — anatomy", () => {
  it("joins and sorts anatomy parts by number", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.anatomy).toBeDefined();
    expect(button.anatomy!.table).toHaveLength(2);
    expect(button.anatomy!.table[0].name).toBe("Container");
    expect(button.anatomy!.table[0].number).toBe(1);
    expect(button.anatomy!.table[1].name).toBe("Label");
    expect(button.anatomy!.table[1].number).toBe(2);
  });

  it("includes anatomy image", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.anatomy!.image).toBe("images/button-anatomy.png");
  });

  it("resolves anatomy image from array", () => {
    const result = denormalize(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    // Toggle has anatomyImage as array and no anatomy parts
    expect(toggle.anatomy).toBeDefined();
    expect(toggle.anatomy!.image).toBe("images/toggle-anatomy.png");
  });

  it("returns undefined anatomy when no parts and no image", () => {
    const result = denormalize(buildRawData());
    const plain = result.find((c) => c.name === "Plain component")!;
    expect(plain.anatomy).toBeUndefined();
  });

  it("warns and skips missing anatomy rowIds", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].anatomy = [
      "anat-01",
      "anat-missing",
    ];
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.anatomy!.table).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalled();
  });
});

// ── Changelog ───────────────────────────────────────────────

describe("denormalize — changelog", () => {
  it("joins changelog entries by rowId", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.changeLog).toHaveLength(1);
    expect(button.changeLog[0].what).toBe("Initial documentation created");
    expect(button.changeLog[0].when).toBe("2025-06-15T10:00:00.000Z");
  });

  it("resolves who via editors lookup", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.changeLog[0].who).toBe("Alice Smith");
  });

  it("returns empty changelog for component with no changelog refs", () => {
    const result = denormalize(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    expect(toggle.changeLog).toEqual([]);
  });

  it("warns and skips missing changelog rowIds", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].changeLog = [
      "cl-01",
      "cl-missing",
    ];
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.changeLog).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("falls back to raw who value when editor lookup fails", () => {
    const raw = buildRawData();
    (raw.changelog.rows as any)["cl-01"].who = "unknown-editor";
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    // lookupName returns "" for missing, then fallback is raw who
    expect(button.changeLog[0].who).toBe("unknown-editor");
  });
});

// ── Decision log ────────────────────────────────────────────

describe("denormalize — decision log", () => {
  it("joins decision log entries by rowId", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.decisionLog).toHaveLength(1);
    expect(button.decisionLog[0].where).toBe("Design review meeting");
    expect(button.decisionLog[0].decisionMade).toBe(
      "Use filled style as default variant",
    );
    expect(button.decisionLog[0].link).toBe(
      "https://docs.example.com/decisions/001",
    );
  });

  it("returns empty decision log for component with no refs", () => {
    const result = denormalize(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    expect(toggle.decisionLog).toEqual([]);
  });

  it("warns and skips missing decision log rowIds", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].decisionLog = [
      "dl-01",
      "dl-missing",
    ];
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.decisionLog).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalled();
  });
});

// ── Child properties (uiBlocksUsedInPattern) ───────────────

describe("denormalize — child properties", () => {
  it("resolves child properties from referenced block components", () => {
    const result = denormalize(buildRawData());
    const pattern = result.find((c) => c.name === "Card pattern")!;
    expect(pattern.childProperties).toBeDefined();
    expect(pattern.childProperties!.length).toBeGreaterThanOrEqual(1);
  });

  it("groups child properties by block component name", () => {
    const result = denormalize(buildRawData());
    const pattern = result.find((c) => c.name === "Card pattern")!;
    const buttonGroup = pattern.childProperties!.find(
      (g) => g.name === "Button",
    );
    expect(buttonGroup).toBeDefined();
    expect(buttonGroup!.properties.length).toBeGreaterThan(0);
  });

  it("excludes blocks with no properties", () => {
    const raw = buildRawData();
    // Add a block with no properties to the pattern refs
    (raw.components.rows as any)["comp-empty-block"] = {
      rowId: "comp-empty-block",
      name: "Empty block",
      type: "type-block",
      tiers: "tier-global",
      documentationStatus: "status-good",
      lastEdited: "",
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
    };
    (raw.components.rows as any)["comp-card-pattern"].uiBlocksUsedInPattern =
      ["comp-button", "comp-empty-block"];
    const result = denormalize(raw);
    const pattern = result.find((c) => c.name === "Card pattern")!;
    const names = pattern.childProperties!.map((g) => g.name);
    expect(names).toContain("Button");
    expect(names).not.toContain("Empty block");
  });

  it("sets childProperties to undefined for non-pattern components", () => {
    const result = denormalize(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.childProperties).toBeUndefined();
  });

  it("sets childProperties to undefined when all blocks have no properties", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-card-pattern"].uiBlocksUsedInPattern =
      ["comp-no-anatomy"]; // comp with no properties
    const result = denormalize(raw);
    const pattern = result.find((c) => c.name === "Card pattern")!;
    expect(pattern.childProperties).toBeUndefined();
  });

  it("warns and skips missing block rowIds", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-card-pattern"].uiBlocksUsedInPattern =
      ["comp-button", "comp-nonexistent"];
    const result = denormalize(raw);
    const pattern = result.find((c) => c.name === "Card pattern")!;
    expect(pattern.childProperties).toBeDefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});

// ── Warnings ────────────────────────────────────────────────

describe("denormalize — warnings", () => {
  it("emits no warnings for valid data", () => {
    denormalize(buildRawData());
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("emits warnings for missing references", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].properties = [
      "prop-disabled",
      "prop-missing",
    ];
    (raw.components.rows as any)["comp-button"].anatomy = ["anat-missing"];
    denormalize(raw);
    // Should have at least 2 warnings
    const allArgs = warnSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(allArgs).toContain("Missing property rowId");
    expect(allArgs).toContain("Missing anatomy rowId");
  });
});

// ── Edge cases ──────────────────────────────────────────────

describe("denormalize — edge cases", () => {
  it("handles empty components table", () => {
    const raw = buildRawData();
    raw.components = { fetchedAt: "2025-01-01T00:00:00.000Z", rows: {} } as any;
    const result = denormalize(raw);
    expect(result).toEqual([]);
  });

  it("handles uiBlocksUsedInPattern as a single string", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-card-pattern"].uiBlocksUsedInPattern =
      "comp-button";
    const result = denormalize(raw);
    const pattern = result.find((c) => c.name === "Card pattern")!;
    expect(pattern.childProperties).toBeDefined();
    const buttonGroup = pattern.childProperties!.find(
      (g) => g.name === "Button",
    );
    expect(buttonGroup).toBeDefined();
  });

  it("handles componentExampleImage as undefined", () => {
    const raw = buildRawData();
    delete (raw.components.rows as any)["comp-button"].componentExampleImage;
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.componentExampleImage).toBe("");
  });

  it("handles empty array for componentExampleImage", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].componentExampleImage = [];
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.componentExampleImage).toBe("");
  });

  it("handles whitespace-only string for uiBlocksUsedInPattern", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-card-pattern"].uiBlocksUsedInPattern =
      "   ";
    const result = denormalize(raw);
    const pattern = result.find((c) => c.name === "Card pattern")!;
    expect(pattern.childProperties).toBeUndefined();
  });

  it("handles whitespace-only string for properties array field", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].properties = "  ";
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.properties).toEqual([]);
  });

  it("handles whitespace-only string for anatomy array field", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].anatomy = "  ";
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    // No anatomy parts, but still has image
    expect(button.anatomy!.table).toEqual([]);
  });

  it("handles whitespace-only string for changeLog array field", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].changeLog = "  ";
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.changeLog).toEqual([]);
  });

  it("handles whitespace-only string for decisionLog array field", () => {
    const raw = buildRawData();
    (raw.components.rows as any)["comp-button"].decisionLog = "  ";
    const result = denormalize(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.decisionLog).toEqual([]);
  });
});
