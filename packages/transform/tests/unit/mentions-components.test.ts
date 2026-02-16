import { describe, it, expect } from "vitest";
import { buildMentionsComponents } from "../../src/common/mentions-components.js";
import type { Component } from "@wiki/shared";

/** Helper to build a minimal component. */
function makeComponent(
  overrides: Partial<Component> & { name: string; slug: string }
): Component {
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
    mentionedIn: [],
    ...overrides,
  };
}

describe("buildMentionsComponents", () => {
  it("builds forward map from mentionedIn data", () => {
    const components = [
      makeComponent({
        name: "Accordion",
        slug: "accordion",
        mentionedIn: [],
      }),
      makeComponent({
        name: "Checkbox",
        slug: "checkbox",
        mentionedIn: [{ name: "Accordion", slug: "accordion" }],
      }),
    ];

    buildMentionsComponents(components);

    // Accordion mentions Checkbox (because Checkbox.mentionedIn includes Accordion)
    expect((components[0] as any).mentionsComponents).toEqual([
      { name: "Checkbox", slug: "checkbox" },
    ]);
    // Checkbox doesn't mention anyone
    expect((components[1] as any).mentionsComponents).toEqual([]);
  });

  it("aggregates from multiple mentionedIn entries", () => {
    const components = [
      makeComponent({ name: "Form", slug: "form", mentionedIn: [] }),
      makeComponent({
        name: "Checkbox",
        slug: "checkbox",
        mentionedIn: [{ name: "Form", slug: "form" }],
      }),
      makeComponent({
        name: "Button",
        slug: "button",
        mentionedIn: [{ name: "Form", slug: "form" }],
      }),
    ];

    buildMentionsComponents(components);

    // Form mentions both Checkbox and Button
    expect((components[0] as any).mentionsComponents).toEqual([
      { name: "Button", slug: "button" },
      { name: "Checkbox", slug: "checkbox" },
    ]);
  });

  it("sorts mentionsComponents alphabetically", () => {
    const components = [
      makeComponent({ name: "Form", slug: "form", mentionedIn: [] }),
      makeComponent({
        name: "Zebra",
        slug: "zebra",
        mentionedIn: [{ name: "Form", slug: "form" }],
      }),
      makeComponent({
        name: "Alpha",
        slug: "alpha",
        mentionedIn: [{ name: "Form", slug: "form" }],
      }),
    ];

    buildMentionsComponents(components);

    expect((components[0] as any).mentionsComponents).toEqual([
      { name: "Alpha", slug: "alpha" },
      { name: "Zebra", slug: "zebra" },
    ]);
  });

  it("returns 0 when no components have mentionedIn", () => {
    const components = [
      makeComponent({ name: "A", slug: "a" }),
      makeComponent({ name: "B", slug: "b" }),
    ];

    const count = buildMentionsComponents(components);
    expect(count).toBe(0);
    expect((components[0] as any).mentionsComponents).toEqual([]);
    expect((components[1] as any).mentionsComponents).toEqual([]);
  });

  it("handles empty component list", () => {
    const count = buildMentionsComponents([]);
    expect(count).toBe(0);
  });

  it("returns count of components that mention others", () => {
    const components = [
      makeComponent({ name: "A", slug: "a", mentionedIn: [] }),
      makeComponent({ name: "B", slug: "b", mentionedIn: [] }),
      makeComponent({
        name: "C",
        slug: "c",
        mentionedIn: [
          { name: "A", slug: "a" },
          { name: "B", slug: "b" },
        ],
      }),
    ];

    const count = buildMentionsComponents(components);
    // A and B both mention C
    expect(count).toBe(2);
  });
});
