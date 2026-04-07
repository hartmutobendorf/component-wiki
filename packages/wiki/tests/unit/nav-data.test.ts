import { describe, it, expect } from "vitest";
import {
  buildNavData,
  CONSTRUCT_TYPE_ORDER,
  CONCEPT_TYPE_ORDER,
  type ConstructEntry,
  type ConceptEntry,
} from "../../src/utils/nav-data.js";

// ── Test Data ───────────────────────────────────────────────

const constructs: ConstructEntry[] = [
  { id: "button", data: { name: "Button", tier: "Global", type: "Component" } },
  { id: "accordion", data: { name: "Accordion", tier: "Global", type: "Component" } },
  { id: "grid", data: { name: "Grid", tier: "Global", type: "Foundation" } },
  { id: "hero", data: { name: "Hero", tier: "Sites", type: "Pattern" } },
  { id: "card", data: { name: "Card", tier: "Global", type: "Block" } },
  { id: "login-form", data: { name: "Login Form", tier: "Apps", type: "Complex component" } },
  { id: "tooltip", data: { name: "Tooltip", tier: "Global", type: "Component" } },
];

const concepts: ConceptEntry[] = [
  { id: "color", data: { name: "Color", tier: "Global", type: "Principle" } },
  { id: "spacing", data: { name: "Spacing", tier: "Global", type: "Principle" } },
  { id: "layout-arch", data: { name: "Layout Architecture", tier: "Global", type: "Architecture" } },
  { id: "nav-guide", data: { name: "Navigation Guide", tier: "Apps", type: "Decision guide" } },
  { id: "typography", data: { name: "Typography", tier: "Global", type: "Principle" } },
];

// ── Constants ───────────────────────────────────────────────

describe("type order constants", () => {
  it("CONSTRUCT_TYPE_ORDER has expected entries", () => {
    expect(CONSTRUCT_TYPE_ORDER).toEqual([
      "Foundation",
      "Block",
      "Component",
      "Complex component",
      "Pattern",
      "Page",
      "Mental model",
    ]);
  });

  it("CONCEPT_TYPE_ORDER has expected entries", () => {
    expect(CONCEPT_TYPE_ORDER).toEqual([
      "Architecture",
      "Principle",
      "Decision guide",
    ]);
  });
});

// ── Filtering by tier ───────────────────────────────────────

describe("buildNavData — tier filtering", () => {
  it("includes only constructs for the given tier", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const constructSection = nav.sections.find((s) => s.heading === "Construct")!;
    const allItems = constructSection.items.flatMap((g) => g.items);

    expect(allItems.every((item) => item.tier === "Global")).toBe(true);
    expect(allItems.find((item) => item.name === "Hero")).toBeUndefined();
    expect(allItems.find((item) => item.name === "Login Form")).toBeUndefined();
  });

  it("includes only concepts for the given tier", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const conceptSection = nav.sections.find((s) => s.heading === "Concept")!;
    const allItems = conceptSection.items.flatMap((g) => g.items);

    expect(allItems.every((item) => item.tier === "Global")).toBe(true);
    expect(allItems.find((item) => item.name === "Navigation Guide")).toBeUndefined();
  });

  it("returns empty groups for a tier with no items", () => {
    const nav = buildNavData("Sites", constructs, concepts);
    const conceptSection = nav.sections.find((s) => s.heading === "Concept")!;
    expect(conceptSection.items).toHaveLength(0);
  });
});

// ── Grouping by type ────────────────────────────────────────

describe("buildNavData — grouping by type", () => {
  it("groups constructs by type", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const constructSection = nav.sections.find((s) => s.heading === "Construct")!;

    const types = constructSection.items.map((g) => g.type);
    expect(types).toContain("Component");
    expect(types).toContain("Foundation");
    expect(types).toContain("Block");
  });

  it("groups concepts by type", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const conceptSection = nav.sections.find((s) => s.heading === "Concept")!;

    const types = conceptSection.items.map((g) => g.type);
    expect(types).toContain("Principle");
    expect(types).toContain("Architecture");
  });

  it("excludes empty groups", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const constructSection = nav.sections.find((s) => s.heading === "Construct")!;

    // No "Pattern", "Page", "Mental model", or "Complex component" in Global
    const types = constructSection.items.map((g) => g.type);
    expect(types).not.toContain("Pattern");
    expect(types).not.toContain("Page");
    expect(types).not.toContain("Mental model");
    expect(types).not.toContain("Complex component");
  });
});

// ── Type ordering ───────────────────────────────────────────

describe("buildNavData — type ordering", () => {
  it("orders construct groups according to CONSTRUCT_TYPE_ORDER", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const constructSection = nav.sections.find((s) => s.heading === "Construct")!;
    const types = constructSection.items.map((g) => g.type);

    // Foundation < Block < Component (by order in CONSTRUCT_TYPE_ORDER)
    const foundationIdx = types.indexOf("Foundation");
    const blockIdx = types.indexOf("Block");
    const componentIdx = types.indexOf("Component");

    expect(foundationIdx).toBeLessThan(blockIdx);
    expect(blockIdx).toBeLessThan(componentIdx);
  });

  it("orders concept groups according to CONCEPT_TYPE_ORDER", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const conceptSection = nav.sections.find((s) => s.heading === "Concept")!;
    const types = conceptSection.items.map((g) => g.type);

    // Architecture < Principle
    const archIdx = types.indexOf("Architecture");
    const principleIdx = types.indexOf("Principle");

    expect(archIdx).toBeLessThan(principleIdx);
  });
});

// ── Alphabetical sorting within groups ──────────────────────

describe("buildNavData — alphabetical sorting", () => {
  it("sorts constructs alphabetically within each group", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const constructSection = nav.sections.find((s) => s.heading === "Construct")!;
    const componentGroup = constructSection.items.find((g) => g.type === "Component")!;

    const names = componentGroup.items.map((i) => i.name);
    expect(names).toEqual(["Accordion", "Button", "Tooltip"]);
  });

  it("sorts concepts alphabetically within each group", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const conceptSection = nav.sections.find((s) => s.heading === "Concept")!;
    const principleGroup = conceptSection.items.find((g) => g.type === "Principle")!;

    const names = principleGroup.items.map((i) => i.name);
    expect(names).toEqual(["Color", "Spacing", "Typography"]);
  });
});

// ── Slug generation ─────────────────────────────────────────

describe("buildNavData — slug generation", () => {
  it("generates correct construct slugs", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const constructSection = nav.sections.find((s) => s.heading === "Construct")!;
    const allItems = constructSection.items.flatMap((g) => g.items);

    const button = allItems.find((i) => i.name === "Button")!;
    expect(button.slug).toBe("global/construct/button");
  });

  it("generates correct concept slugs", () => {
    const nav = buildNavData("Global", constructs, concepts);
    const conceptSection = nav.sections.find((s) => s.heading === "Concept")!;
    const allItems = conceptSection.items.flatMap((g) => g.items);

    const color = allItems.find((i) => i.name === "Color")!;
    expect(color.slug).toBe("global/concept/color");
  });
});

// ── Section structure ───────────────────────────────────────

describe("buildNavData — section structure", () => {
  it("always returns two sections: Concept and Construct", () => {
    const nav = buildNavData("Global", constructs, concepts);
    expect(nav.sections).toHaveLength(2);
    expect(nav.sections[0].heading).toBe("Concept");
    expect(nav.sections[1].heading).toBe("Construct");
  });

  it("returns two sections even with empty collections", () => {
    const nav = buildNavData("Global", [], []);
    expect(nav.sections).toHaveLength(2);
    expect(nav.sections[0].items).toHaveLength(0);
    expect(nav.sections[1].items).toHaveLength(0);
  });
});
