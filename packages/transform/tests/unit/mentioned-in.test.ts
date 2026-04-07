import { describe, it, expect } from "vitest";
import { extractMentionedSlugs, buildMentionedIn } from "../../src/common/mentioned-in.js";
import type { Construct } from "@wiki/shared";

function makeItem(
  overrides: Partial<Construct> & { name: string; slug: string }
): Construct {
  return {
    kind: "construct",
    type: "Component",
    tier: "Global",
    documentationStatus: "All good",
    lastEdited: "",
    figmaLink: "",
    codeLink: "",
    description: "",
    usage: "",
    examples: "",
    figmaComponentData: "",
    componentExampleImage: "",
    properties: [],
    changeLog: [],
    decisionLog: [],
    appliedRules: [],
    exceptionFromRules: [],
    mentionedIn: [],
    ...overrides,
  };
}

describe("extractMentionedSlugs", () => {
  it("extracts a slug from a tiered construct link in description", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "Use with [Checkbox](/global/construct/checkbox) for filters.",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["checkbox"]));
  });

  it("extracts slugs from tiered concept links", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "See [Site](/sites/concept/site) for context.",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["site"]));
  });

  it("extracts from usage and examples", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      usage: "Combine with [Button](/global/construct/button).",
      examples: "See [Input](/apps/construct/input) for forms.",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["button", "input"]));
  });

  it("deduplicates", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "[Checkbox](/global/construct/checkbox) and [Checkbox](/global/construct/checkbox).",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["checkbox"]));
  });

  it("strips #section anchors from construct links", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "See [Size](/global/construct/button#properties).",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["button"]));
  });

  it("strips #section anchors from concept links", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "See [Site](/sites/concept/site#changelog).",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["site"]));
  });

  it("excludes self-references", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "[Accordion](/global/construct/accordion).",
    });
    expect(extractMentionedSlugs(item).size).toBe(0);
  });

  it("returns empty set for no links", () => {
    const item = makeItem({ name: "Accordion", slug: "accordion" });
    expect(extractMentionedSlugs(item).size).toBe(0);
  });

  it("ignores external links", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "See [Docs](https://example.com/docs).",
    });
    expect(extractMentionedSlugs(item).size).toBe(0);
  });
});

describe("buildMentionedIn", () => {
  it("builds reverse index with correct path from a single mention", () => {
    const items = [
      makeItem({ name: "Accordion", slug: "accordion", tier: "Global", usage: "Use [Checkbox](/global/construct/checkbox)." }),
      makeItem({ name: "Checkbox", slug: "checkbox", tier: "Global" }),
    ];
    const count = buildMentionedIn(items);
    expect(count).toBe(1);
    expect(items[1].mentionedIn).toEqual([
      { name: "Accordion", slug: "accordion", path: "global/construct/accordion" },
    ]);
  });

  it("sorts mentionedIn alphabetically", () => {
    const items = [
      makeItem({ name: "Zebra", slug: "zebra", tier: "Sites", description: "[Target](/global/construct/target)." }),
      makeItem({ name: "Alpha", slug: "alpha", tier: "Apps", description: "[Target](/global/construct/target)." }),
      makeItem({ name: "Target", slug: "target", tier: "Global" }),
    ];
    buildMentionedIn(items);
    expect(items[2].mentionedIn).toEqual([
      { name: "Alpha", slug: "alpha", path: "apps/construct/alpha" },
      { name: "Zebra", slug: "zebra", path: "sites/construct/zebra" },
    ]);
  });

  it("returns 0 when no mentions", () => {
    const items = [
      makeItem({ name: "A", slug: "a" }),
      makeItem({ name: "B", slug: "b" }),
    ];
    expect(buildMentionedIn(items)).toBe(0);
  });

  it("handles empty list", () => {
    expect(buildMentionedIn([])).toBe(0);
  });
});
