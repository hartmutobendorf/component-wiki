import { describe, it, expect } from "vitest";
import {
  TIERS,
  tierToPrefix,
  prefixToTier,
  buildConstructPath,
  filterByTier,
} from "../../src/utils/tiers.js";

// ── Constants ───────────────────────────────────────────────

describe("TIERS constant", () => {
  it("contains exactly Global, Apps, and Sites", () => {
    expect(TIERS).toEqual(["Global", "Apps", "Sites"]);
  });

  it("has 3 entries", () => {
    expect(TIERS).toHaveLength(3);
  });
});

// ── tierToPrefix ────────────────────────────────────────────

describe("tierToPrefix", () => {
  it("converts Global to global", () => {
    expect(tierToPrefix("Global")).toBe("global");
  });

  it("converts Apps to apps", () => {
    expect(tierToPrefix("Apps")).toBe("apps");
  });

  it("converts Sites to sites", () => {
    expect(tierToPrefix("Sites")).toBe("sites");
  });

  it("lowercases arbitrary strings", () => {
    expect(tierToPrefix("SomeOther")).toBe("someother");
  });
});

// ── prefixToTier ────────────────────────────────────────────

describe("prefixToTier", () => {
  it("converts global to Global", () => {
    expect(prefixToTier("global")).toBe("Global");
  });

  it("converts apps to Apps", () => {
    expect(prefixToTier("apps")).toBe("Apps");
  });

  it("converts sites to Sites", () => {
    expect(prefixToTier("sites")).toBe("Sites");
  });

  it("is case-insensitive", () => {
    expect(prefixToTier("GLOBAL")).toBe("Global");
    expect(prefixToTier("Apps")).toBe("Apps");
    expect(prefixToTier("sItEs")).toBe("Sites");
  });

  it("returns undefined for invalid prefix", () => {
    expect(prefixToTier("unknown")).toBeUndefined();
    expect(prefixToTier("")).toBeUndefined();
  });
});

// ── buildConstructPath ──────────────────────────────────────

describe("buildConstructPath", () => {
  it("builds path for Global tier", () => {
    expect(buildConstructPath("Global", "button")).toBe("global/button");
  });

  it("builds path for Apps tier", () => {
    expect(buildConstructPath("Apps", "side-navigation")).toBe(
      "apps/side-navigation",
    );
  });

  it("builds path for Sites tier", () => {
    expect(buildConstructPath("Sites", "hero")).toBe("sites/hero");
  });

  it("handles slugs with hyphens", () => {
    expect(buildConstructPath("Global", "code-snippet")).toBe(
      "global/code-snippet",
    );
  });
});

// ── filterByTier ────────────────────────────────────────────

describe("filterByTier", () => {
  const items = [
    { name: "Button", tiers: "Global" },
    { name: "Hero", tiers: "Sites" },
    { name: "Side Navigation", tiers: "Apps" },
    { name: "Accordion", tiers: "Global" },
    { name: "Blog", tiers: "Sites" },
    { name: "Form Placement", tiers: "Apps" },
  ];

  it("filters to only Global items", () => {
    const result = filterByTier(items, "Global");
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toEqual(["Button", "Accordion"]);
  });

  it("filters to only Sites items", () => {
    const result = filterByTier(items, "Sites");
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toEqual(["Hero", "Blog"]);
  });

  it("filters to only Apps items", () => {
    const result = filterByTier(items, "Apps");
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toEqual([
      "Side Navigation",
      "Form Placement",
    ]);
  });

  it("returns empty array when no items match", () => {
    const result = filterByTier(items, "Unknown");
    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    const result = filterByTier([], "Global");
    expect(result).toHaveLength(0);
  });

  it("is case-sensitive on tier value", () => {
    const result = filterByTier(items, "global");
    expect(result).toHaveLength(0);
  });
});
