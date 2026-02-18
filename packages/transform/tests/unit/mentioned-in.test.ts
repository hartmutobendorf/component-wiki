import { describe, it, expect } from "vitest";
import { extractMentionedSlugs, buildMentionedIn } from "../../src/common/mentioned-in.js";
import type { Construct } from "@wiki/shared";

function makeItem(
  overrides: Partial<Construct> & { name: string; slug: string }
): Construct {
  return {
    type: "Component",
    tiers: "Global",
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
  it("extracts a slug from description", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "Use with [Checkbox](/checkbox) for filters.",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["checkbox"]));
  });

  it("extracts from usage and examples", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      usage: "Combine with [Button](/button).",
      examples: "See [Input](/input) for forms.",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["button", "input"]));
  });

  it("deduplicates", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "[Checkbox](/checkbox) and [Checkbox](/checkbox).",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["checkbox"]));
  });

  it("strips #section anchors", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "See [Size](/button#properties).",
    });
    expect(extractMentionedSlugs(item)).toEqual(new Set(["button"]));
  });

  it("excludes self-references", () => {
    const item = makeItem({
      name: "Accordion",
      slug: "accordion",
      description: "[Accordion](/accordion).",
    });
    expect(extractMentionedSlugs(item).size).toBe(0);
  });

  it("returns empty set for no links", () => {
    const item = makeItem({ name: "Accordion", slug: "accordion" });
    expect(extractMentionedSlugs(item).size).toBe(0);
  });
});

describe("buildMentionedIn", () => {
  it("builds reverse index from a single mention", () => {
    const items = [
      makeItem({ name: "Accordion", slug: "accordion", usage: "Use [Checkbox](/checkbox)." }),
      makeItem({ name: "Checkbox", slug: "checkbox" }),
    ];
    const count = buildMentionedIn(items);
    expect(count).toBe(1);
    expect(items[1].mentionedIn).toEqual([{ name: "Accordion", slug: "accordion" }]);
  });

  it("sorts mentionedIn alphabetically", () => {
    const items = [
      makeItem({ name: "Zebra", slug: "zebra", description: "[Target](/target)." }),
      makeItem({ name: "Alpha", slug: "alpha", description: "[Target](/target)." }),
      makeItem({ name: "Target", slug: "target" }),
    ];
    buildMentionedIn(items);
    expect(items[2].mentionedIn).toEqual([
      { name: "Alpha", slug: "alpha" },
      { name: "Zebra", slug: "zebra" },
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
