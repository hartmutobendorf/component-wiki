import { describe, it, expect } from "vitest";
import { extractMentionedSlugs, buildMentionedIn } from "../../src/mentioned-in.js";
import type { Component } from "@wiki/shared";

/** Helper to build a minimal component with specific markdown fields. */
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

// ── extractMentionedSlugs ───────────────────────────────────

describe("extractMentionedSlugs", () => {
  it("extracts a slug from a link in description", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
      description: "Use with [Checkbox](/checkbox) for filters.",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs).toEqual(new Set(["checkbox"]));
  });

  it("extracts slugs from usage and examples", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
      usage: "Combine with [Button](/button).",
      examples: "See [Input](/input) for forms.",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs).toEqual(new Set(["button", "input"]));
  });

  it("extracts slugs from all three fields combined", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
      description: "[A](/a-comp)",
      usage: "[B](/b-comp)",
      examples: "[C](/c-comp)",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs).toEqual(new Set(["a-comp", "b-comp", "c-comp"]));
  });

  it("deduplicates slugs mentioned multiple times", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
      description: "[Checkbox](/checkbox) and also [Checkbox](/checkbox).",
      usage: "Again [Checkbox](/checkbox).",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs).toEqual(new Set(["checkbox"]));
  });

  it("strips #section anchors to get the base slug", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
      description: "See [Size](/button#properties) property.",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs).toEqual(new Set(["button"]));
  });

  it("excludes self-references", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
      description: "See [Accordion](/accordion) for more.",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs.size).toBe(0);
  });

  it("ignores external URLs", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
      description:
        "[Vanilla](https://vanillaframework.io) and [Checkbox](/checkbox).",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs).toEqual(new Set(["checkbox"]));
  });

  it("ignores image links", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
      description: "![img](/images/pic.png) and [Button](/button).",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs).toEqual(new Set(["button"]));
  });

  it("returns empty set for no links", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
      description: "Just plain text.",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs.size).toBe(0);
  });

  it("returns empty set for empty fields", () => {
    const comp = makeComponent({
      name: "Accordion",
      slug: "accordion",
    });
    const slugs = extractMentionedSlugs(comp);
    expect(slugs.size).toBe(0);
  });
});

// ── buildMentionedIn ────────────────────────────────────────

describe("buildMentionedIn", () => {
  it("builds a reverse index from a single mention", () => {
    const components = [
      makeComponent({
        name: "Accordion",
        slug: "accordion",
        usage: "Use with [Checkbox](/checkbox) for filters.",
      }),
      makeComponent({ name: "Checkbox", slug: "checkbox" }),
    ];

    const count = buildMentionedIn(components);

    expect(count).toBe(1);
    expect(components[1].mentionedIn).toEqual([
      { name: "Accordion", slug: "accordion" },
    ]);
    expect(components[0].mentionedIn).toEqual([]);
  });

  it("aggregates mentions from multiple components", () => {
    const components = [
      makeComponent({
        name: "Accordion",
        slug: "accordion",
        usage: "Use with [Checkbox](/checkbox).",
      }),
      makeComponent({
        name: "Form",
        slug: "form",
        description: "Contains [Checkbox](/checkbox) and [Button](/button).",
      }),
      makeComponent({ name: "Checkbox", slug: "checkbox" }),
      makeComponent({ name: "Button", slug: "button" }),
    ];

    const count = buildMentionedIn(components);

    expect(count).toBe(2); // Checkbox and Button both have mentions
    expect(components[2].mentionedIn).toEqual([
      { name: "Accordion", slug: "accordion" },
      { name: "Form", slug: "form" },
    ]);
    expect(components[3].mentionedIn).toEqual([
      { name: "Form", slug: "form" },
    ]);
  });

  it("sorts mentionedIn entries alphabetically by name", () => {
    const components = [
      makeComponent({
        name: "Zebra",
        slug: "zebra",
        description: "[Target](/target).",
      }),
      makeComponent({
        name: "Alpha",
        slug: "alpha",
        description: "[Target](/target).",
      }),
      makeComponent({
        name: "Middle",
        slug: "middle",
        description: "[Target](/target).",
      }),
      makeComponent({ name: "Target", slug: "target" }),
    ];

    buildMentionedIn(components);

    expect(components[3].mentionedIn).toEqual([
      { name: "Alpha", slug: "alpha" },
      { name: "Middle", slug: "middle" },
      { name: "Zebra", slug: "zebra" },
    ]);
  });

  it("does not create mentionedIn for unmentioned components", () => {
    const components = [
      makeComponent({
        name: "Accordion",
        slug: "accordion",
        usage: "[Checkbox](/checkbox).",
      }),
      makeComponent({ name: "Checkbox", slug: "checkbox" }),
      makeComponent({ name: "Button", slug: "button" }),
    ];

    buildMentionedIn(components);

    expect(components[2].mentionedIn).toEqual([]);
  });

  it("handles links with section anchors", () => {
    const components = [
      makeComponent({
        name: "Accordion",
        slug: "accordion",
        description: "See [disabled](/button#properties) property.",
      }),
      makeComponent({ name: "Button", slug: "button" }),
    ];

    buildMentionedIn(components);

    expect(components[1].mentionedIn).toEqual([
      { name: "Accordion", slug: "accordion" },
    ]);
  });

  it("deduplicates: same source mentions same target multiple times", () => {
    const components = [
      makeComponent({
        name: "Accordion",
        slug: "accordion",
        description: "[Button](/button) and [Button](/button#properties).",
      }),
      makeComponent({ name: "Button", slug: "button" }),
    ];

    buildMentionedIn(components);

    // Accordion should appear only once in Button's mentionedIn
    expect(components[1].mentionedIn).toEqual([
      { name: "Accordion", slug: "accordion" },
    ]);
  });

  it("returns 0 when no components mention each other", () => {
    const components = [
      makeComponent({ name: "A", slug: "a", description: "No links." }),
      makeComponent({ name: "B", slug: "b", usage: "Also no links." }),
    ];

    const count = buildMentionedIn(components);

    expect(count).toBe(0);
    expect(components[0].mentionedIn).toEqual([]);
    expect(components[1].mentionedIn).toEqual([]);
  });

  it("handles empty component list", () => {
    const count = buildMentionedIn([]);
    expect(count).toBe(0);
  });

  it("handles mention of a slug that doesn't match any component", () => {
    const components = [
      makeComponent({
        name: "Accordion",
        slug: "accordion",
        description: "[Ghost](/ghost-component).",
      }),
    ];

    const count = buildMentionedIn(components);

    // ghost-component doesn't exist, so mentionedIn map entry is orphaned
    expect(count).toBe(0);
    expect(components[0].mentionedIn).toEqual([]);
  });
});
