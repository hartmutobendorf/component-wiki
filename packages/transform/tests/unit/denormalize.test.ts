import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { denormalizeConstructs, denormalizeConcepts } from "../../src/common/denormalize.js";
import { constructSchema, conceptSchema } from "@wiki/shared";
import type { SyncConfig } from "../../src/common/types.js";
import { buildRawData } from "../fixtures/raw-data.js";

let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
});

// ══════════════════════════════════════════════════════════════
// Construct denormalization
// ══════════════════════════════════════════════════════════════

describe("denormalizeConstructs — basic output", () => {
  it("returns an array of constructs", () => {
    const result = denormalizeConstructs(buildRawData());
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters out Block-type constructs", () => {
    const result = denormalizeConstructs(buildRawData());
    const names = result.map((c) => c.name);
    expect(names).not.toContain("Internal block");
  });

  it("includes non-Block constructs", () => {
    const result = denormalizeConstructs(buildRawData());
    const names = result.map((c) => c.name);
    expect(names).toContain("Button");
    expect(names).toContain("Toggle switch");
    expect(names).toContain("Card pattern");
    expect(names).toContain("Plain component");
  });

  it("all output passes constructSchema validation", () => {
    const result = denormalizeConstructs(buildRawData());
    for (const construct of result) {
      const parsed = constructSchema.safeParse(construct);
      if (!parsed.success) {
        throw new Error(`Construct "${construct.name}" failed validation: ${parsed.error.message}`);
      }
    }
  });
});

describe("denormalizeConstructs — slug generation", () => {
  it("generates a lowercase slug", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.slug).toBe("button");
  });

  it("replaces spaces with hyphens", () => {
    const result = denormalizeConstructs(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    expect(toggle.slug).toBe("toggle-switch");
  });
});

describe("denormalizeConstructs — lookup resolution", () => {
  it("resolves type name", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.type).toBe("Component");
  });

  it("resolves tier name", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.tiers).toBe("Global");
  });

  it("resolves documentation status", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.documentationStatus).toBe("All good");
  });

  it("returns empty string for missing lookup", () => {
    const raw = buildRawData();
    (raw.construct.rows as any)["comp-button"].tiers = "nonexistent";
    const result = denormalizeConstructs(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.tiers).toBe("");
  });
});

describe("denormalizeConstructs — scalar fields", () => {
  it("maps description, usage, examples", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.description).toBe("A clickable button for triggering actions.");
    expect(button.usage).toBe("Use buttons for primary and secondary actions.");
    expect(button.examples).toBe("See the design system for usage examples.");
  });

  it("maps figmaLink and codeLink", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.figmaLink).toBe("https://www.figma.com/design/abc123/Library");
    expect(button.codeLink).toBe("https://github.com/org/repo/tree/main/button");
  });

  it("defaults missing strings to empty", () => {
    const result = denormalizeConstructs(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    expect(toggle.figmaLink).toBe("");
    expect(toggle.codeLink).toBe("");
  });
});

describe("denormalizeConstructs — new rule fields", () => {
  it("resolves appliedRules from raw rule IDs to full rule objects", () => {
    const result = denormalizeConstructs(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    expect(toggle.appliedRules).toHaveLength(1);
    expect(toggle.appliedRules[0]).toMatchObject({
      rule: "Dividers must separate sections.",
      ruleStrength: "MUST",
      status: "Approved",
      type: "Specific rule",
      lastEdited: "2026-02-18T09:35:07.035+00:00",
      appliesToConcepts: ["Site"],
      appliesToConstructs: ["Toggle switch"],
    });
  });

  it("maps exceptionFromRules from raw data", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.exceptionFromRules).toEqual([]);
  });
});

describe("denormalizeConstructs — image resolution", () => {
  it("resolves from string", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.componentExampleImage).toBe("images/button-example.png");
  });

  it("resolves from array", () => {
    const result = denormalizeConstructs(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    expect(toggle.componentExampleImage).toBe("images/toggle-example.png");
  });
});

describe("denormalizeConstructs — properties", () => {
  it("joins properties by rowId", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.properties).toHaveLength(3);
  });

  it("resolves property type", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    const disabled = button.properties.find((p) => p.name === "disabled")!;
    expect(disabled.type).toBe("boolean");
  });

  it("parses options", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    const variant = button.properties.find((p) => p.name === "variant")!;
    expect(variant.options).toEqual(["primary", "secondary", "ghost"]);
  });

  it("converts boolean defaultOption to string", () => {
    const result = denormalizeConstructs(buildRawData());
    const toggle = result.find((c) => c.name === "Toggle switch")!;
    const checked = toggle.properties.find((p) => p.name === "checked")!;
    expect(checked.defaultOption).toBe("false");
  });

  it("warns and skips missing property rowIds", () => {
    const raw = buildRawData();
    (raw.construct.rows as any)["comp-button"].properties = ["prop-disabled", "prop-nonexistent"];
    const result = denormalizeConstructs(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.properties).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("denormalizeConstructs — anatomy", () => {
  it("sorts parts by number", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.anatomy!.table[0].name).toBe("Container");
    expect(button.anatomy!.table[1].name).toBe("Label");
  });

  it("returns undefined anatomy when no parts and no image", () => {
    const result = denormalizeConstructs(buildRawData());
    const plain = result.find((c) => c.name === "Plain component")!;
    expect(plain.anatomy).toBeUndefined();
  });
});

describe("denormalizeConstructs — changelog", () => {
  it("resolves who via editors lookup", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.changeLog[0].who).toBe("Alice Smith");
  });
});

describe("denormalizeConstructs — decision log", () => {
  it("joins decision log entries", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.decisionLog).toHaveLength(1);
    expect(button.decisionLog[0].where).toBe("Design review meeting");
  });
});

describe("denormalizeConstructs — child properties", () => {
  it("resolves child properties from blocks", () => {
    const result = denormalizeConstructs(buildRawData());
    const pattern = result.find((c) => c.name === "Card pattern")!;
    expect(pattern.childProperties).toBeDefined();
    const buttonGroup = pattern.childProperties!.find((g) => g.name === "Button");
    expect(buttonGroup).toBeDefined();
  });

  it("sets childProperties to undefined for non-patterns", () => {
    const result = denormalizeConstructs(buildRawData());
    const button = result.find((c) => c.name === "Button")!;
    expect(button.childProperties).toBeUndefined();
  });
});

describe("denormalizeConstructs — wiki-ref resolution", () => {
  const syncConfig: SyncConfig = {
    baseUrl: "https://coda.io/apis/v1",
    docId: "test-doc",
    tables: {
      construct: { id: "grid-comp" },
      constructProperties: { id: "grid-prop" },
      constructAnatomy: { id: "grid-anat" },
      documentationChangelog: { id: "grid-cl" },
      documentationDecisionlog: { id: "grid-dl" },
      constructTypes: { id: "grid-types" },
      documentationTiers: { id: "grid-tiers" },
      documentationStatus: { id: "grid-ds" },
      constructPropertyTypes: { id: "grid-pt" },
      documentationEditors: { id: "grid-ed" },
      concepts: { id: "grid-conc" },
      rules: { id: "grid-rules" },
      conceptTypes: { id: "grid-ct" },
      documentationRequirementLevels: { id: "grid-drl" },
      ruleStatus: { id: "grid-rs" },
      ruleTypes: { id: "grid-rt" },
    },
  };

  it("resolves wiki-ref construct links in description", () => {
    const raw = buildRawData();
    (raw.construct.rows as any)["comp-button"].description =
      "See [Toggle switch](wiki-ref://grid-comp/comp-toggle) for details.";
    const result = denormalizeConstructs(raw, syncConfig);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.description).toBe("See [Toggle switch](/toggle-switch) for details.");
  });

  it("does not resolve when no syncConfig", () => {
    const raw = buildRawData();
    (raw.construct.rows as any)["comp-button"].description =
      "See [Toggle](wiki-ref://grid-comp/comp-toggle) here.";
    const result = denormalizeConstructs(raw);
    const button = result.find((c) => c.name === "Button")!;
    expect(button.description).toContain("wiki-ref://");
  });
});

describe("denormalizeConstructs — warnings", () => {
  it("emits no warnings for valid data", () => {
    denormalizeConstructs(buildRawData());
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("denormalizeConstructs — edge cases", () => {
  it("handles empty construct table", () => {
    const raw = buildRawData();
    raw.construct = { fetchedAt: "2025-01-01T00:00:00.000Z", rows: {} } as any;
    const result = denormalizeConstructs(raw);
    expect(result).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════
// Concept denormalization
// ══════════════════════════════════════════════════════════════

describe("denormalizeConcepts — basic output", () => {
  it("returns an array of concepts", () => {
    const result = denormalizeConcepts(buildRawData());
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("all output passes conceptSchema validation", () => {
    const result = denormalizeConcepts(buildRawData());
    for (const concept of result) {
      const parsed = conceptSchema.safeParse(concept);
      if (!parsed.success) {
        throw new Error(`Concept "${concept.name}" failed validation: ${parsed.error.message}`);
      }
    }
  });
});

describe("denormalizeConcepts — slug generation", () => {
  it("generates a slug from concept name", () => {
    const result = denormalizeConcepts(buildRawData());
    const site = result.find((c) => c.name === "Site")!;
    expect(site.slug).toBe("site");
  });
});

describe("denormalizeConcepts — lookup resolution", () => {
  it("resolves concept type", () => {
    const result = denormalizeConcepts(buildRawData());
    const site = result.find((c) => c.name === "Site")!;
    expect(site.type).toBe("Decision guide");
  });

  it("resolves tier", () => {
    const result = denormalizeConcepts(buildRawData());
    const site = result.find((c) => c.name === "Site")!;
    expect(site.tier).toBe("Global");
  });

  it("resolves documentation status", () => {
    const result = denormalizeConcepts(buildRawData());
    const site = result.find((c) => c.name === "Site")!;
    expect(site.documentationStatus).toBe("All good");
  });
});

describe("denormalizeConcepts — content fields", () => {
  it("maps description and content", () => {
    const result = denormalizeConcepts(buildRawData());
    const site = result.find((c) => c.name === "Site")!;
    expect(site.description).toBe("The complete web property.");
    expect(site.content).toBe("Detailed content about sites.");
  });

  it("defaults empty content to empty string", () => {
    const result = denormalizeConcepts(buildRawData());
    const page = result.find((c) => c.name === "Page")!;
    expect(page.content).toBe("");
  });
});

describe("denormalizeConcepts — rule fields", () => {
  it("resolves appliedRules from raw rule IDs to full rule objects", () => {
    const result = denormalizeConcepts(buildRawData());
    const site = result.find((c) => c.name === "Site")!;
    expect(site.appliedRules).toHaveLength(1);
    expect(site.appliedRules[0]).toMatchObject({
      rule: "Dividers must separate sections.",
      ruleStrength: "MUST",
      status: "Approved",
      type: "Specific rule",
      lastEdited: "2026-02-18T09:35:07.035+00:00",
      appliesToConcepts: ["Site"],
      appliesToConstructs: ["Toggle switch"],
    });
  });

  it("resolves exceptedFromRules from raw rule IDs to full rule objects", () => {
    const result = denormalizeConcepts(buildRawData());
    const page = result.find((c) => c.name === "Page")!;
    expect(page.exceptedFromRules).toHaveLength(1);
    expect(page.exceptedFromRules[0]).toMatchObject({
      rule: "Dividers must separate sections.",
      ruleStrength: "MUST",
      status: "Approved",
      type: "Specific rule",
    });
  });
});

describe("denormalizeConcepts — changelog", () => {
  it("resolves changelog entries with editor lookup", () => {
    const result = denormalizeConcepts(buildRawData());
    const site = result.find((c) => c.name === "Site")!;
    expect(site.changeLog).toHaveLength(1);
    expect(site.changeLog[0].who).toBe("Bob Jones");
    expect(site.changeLog[0].what).toBe("Added concept content");
  });

  it("returns empty changelog when no refs", () => {
    const result = denormalizeConcepts(buildRawData());
    const page = result.find((c) => c.name === "Page")!;
    expect(page.changeLog).toEqual([]);
  });
});

describe("denormalizeConcepts — edge cases", () => {
  it("handles empty concepts table", () => {
    const raw = buildRawData();
    raw.concepts = { fetchedAt: "2025-01-01T00:00:00.000Z", rows: {} } as any;
    const result = denormalizeConcepts(raw);
    expect(result).toEqual([]);
  });

  it("warns on missing changelog rowId", () => {
    const raw = buildRawData();
    (raw.concepts.rows as any)["conc-site"].changelog = ["cl-missing"];
    denormalizeConcepts(raw);
    expect(warnSpy).toHaveBeenCalled();
  });
});
