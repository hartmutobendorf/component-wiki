import { describe, it, expect } from "vitest";
import { buildMentionsComponents } from "../../src/common/mentions-components.js";
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

describe("buildMentionsComponents", () => {
  it("builds forward map from mentionedIn with correct paths", () => {
    const items = [
      makeItem({ name: "Accordion", slug: "accordion", tier: "Global" }),
      makeItem({
        name: "Checkbox",
        slug: "checkbox",
        tier: "Global",
        mentionedIn: [{ name: "Accordion", slug: "accordion", path: "global/construct/accordion" }],
      }),
    ];
    buildMentionsComponents(items);
    expect((items[0] as any).mentionsComponents).toEqual([
      { name: "Checkbox", slug: "checkbox", path: "global/construct/checkbox" },
    ]);
    expect((items[1] as any).mentionsComponents).toEqual([]);
  });

  it("sorts alphabetically", () => {
    const items = [
      makeItem({ name: "Form", slug: "form", tier: "Global" }),
      makeItem({
        name: "Zebra",
        slug: "zebra",
        tier: "Sites",
        mentionedIn: [{ name: "Form", slug: "form", path: "global/construct/form" }],
      }),
      makeItem({
        name: "Alpha",
        slug: "alpha",
        tier: "Apps",
        mentionedIn: [{ name: "Form", slug: "form", path: "global/construct/form" }],
      }),
    ];
    buildMentionsComponents(items);
    expect((items[0] as any).mentionsComponents).toEqual([
      { name: "Alpha", slug: "alpha", path: "apps/construct/alpha" },
      { name: "Zebra", slug: "zebra", path: "sites/construct/zebra" },
    ]);
  });

  it("returns 0 when no mentionedIn", () => {
    const items = [makeItem({ name: "A", slug: "a" })];
    expect(buildMentionsComponents(items)).toBe(0);
  });

  it("handles empty list", () => {
    expect(buildMentionsComponents([])).toBe(0);
  });
});
