import { describe, it, expect } from "vitest";
import { buildMentionsComponents } from "../../src/common/mentions-components.js";
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

describe("buildMentionsComponents", () => {
  it("builds forward map from mentionedIn", () => {
    const items = [
      makeItem({ name: "Accordion", slug: "accordion" }),
      makeItem({ name: "Checkbox", slug: "checkbox", mentionedIn: [{ name: "Accordion", slug: "accordion" }] }),
    ];
    buildMentionsComponents(items);
    expect((items[0] as any).mentionsComponents).toEqual([{ name: "Checkbox", slug: "checkbox" }]);
    expect((items[1] as any).mentionsComponents).toEqual([]);
  });

  it("sorts alphabetically", () => {
    const items = [
      makeItem({ name: "Form", slug: "form" }),
      makeItem({ name: "Zebra", slug: "zebra", mentionedIn: [{ name: "Form", slug: "form" }] }),
      makeItem({ name: "Alpha", slug: "alpha", mentionedIn: [{ name: "Form", slug: "form" }] }),
    ];
    buildMentionsComponents(items);
    expect((items[0] as any).mentionsComponents).toEqual([
      { name: "Alpha", slug: "alpha" },
      { name: "Zebra", slug: "zebra" },
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
