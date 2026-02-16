import { describe, it, expect } from "vitest";
import { toAgentDetail, toIndexEntry } from "../../src/targets/agent.js";
import type { Component } from "@wiki/shared";

/** Helper to build a minimal component with specific fields. */
function makeComponent(
  overrides: Partial<Component> & { name: string; slug: string }
): Component {
  return {
    type: "Component",
    tiers: "Global",
    documentationStatus: "All good",
    lastEdited: "2025-06-15T10:00:00.000Z",
    figmaLink: "https://figma.com/file/abc",
    codeLink: "https://github.com/org/repo",
    description: "A test component for triggering actions.",
    usage: "Use it wisely.",
    examples: "See examples.",
    interactions: "Click to interact.",
    figmaComponentData: "base64-encoded-figma-data-very-long",
    componentExampleImage: "images/example.png",
    properties: [
      {
        name: "disabled",
        required: false,
        type: "boolean",
        description: "Prevents interaction.",
        constraint: "",
        defaultOption: "false",
      },
    ],
    changeLog: [],
    decisionLog: [],
    mentionedIn: [],
    ...overrides,
  };
}

// ── toAgentDetail ───────────────────────────────────────────

describe("toAgentDetail", () => {
  it("strips figmaComponentData", () => {
    const detail = toAgentDetail(makeComponent({ name: "Button", slug: "button" }));
    expect(detail).not.toHaveProperty("figmaComponentData");
  });

  it("strips componentExampleImage", () => {
    const detail = toAgentDetail(makeComponent({ name: "Button", slug: "button" }));
    expect(detail).not.toHaveProperty("componentExampleImage");
  });

  it("strips anatomy.image but preserves anatomy.table", () => {
    const comp = makeComponent({
      name: "Button",
      slug: "button",
      anatomy: {
        image: "images/anatomy.png",
        table: [{ number: 1, name: "Container", description: "The wrapper." }],
      },
    });
    const detail = toAgentDetail(comp);
    const anatomy = detail.anatomy as { image?: string; table: unknown[] };
    expect(anatomy.image).toBeUndefined();
    expect(anatomy.table).toHaveLength(1);
    expect(anatomy.table[0]).toEqual({ number: 1, name: "Container", description: "The wrapper." });
  });

  it("handles component with no anatomy", () => {
    const comp = makeComponent({ name: "Plain", slug: "plain" });
    // No anatomy set by default in makeComponent
    const detail = toAgentDetail(comp);
    expect(detail.anatomy).toBeUndefined();
  });

  it("adds url field from slug", () => {
    const detail = toAgentDetail(makeComponent({ name: "Button", slug: "button" }));
    expect(detail.url).toBe("https://component.wiki/button");
  });

  it("adds url field for multi-word slugs", () => {
    const detail = toAgentDetail(makeComponent({ name: "Toggle switch", slug: "toggle-switch" }));
    expect(detail.url).toBe("https://component.wiki/toggle-switch");
  });

  it("preserves all non-stripped fields", () => {
    const comp = makeComponent({ name: "Button", slug: "button" });
    const detail = toAgentDetail(comp);

    expect(detail.name).toBe("Button");
    expect(detail.slug).toBe("button");
    expect(detail.type).toBe("Component");
    expect(detail.tiers).toBe("Global");
    expect(detail.description).toBe("A test component for triggering actions.");
    expect(detail.usage).toBe("Use it wisely.");
    expect(detail.examples).toBe("See examples.");
    expect(detail.interactions).toBe("Click to interact.");
    expect(detail.figmaLink).toBe("https://figma.com/file/abc");
    expect(detail.codeLink).toBe("https://github.com/org/repo");
    expect(detail.properties).toHaveLength(1);
    expect(detail.mentionedIn).toEqual([]);
  });

  it("includes mentionsComponents when attached by orchestrator", () => {
    const comp = makeComponent({ name: "Button", slug: "button" });
    (comp as any).mentionsComponents = [{ name: "Link", slug: "link" }];
    const detail = toAgentDetail(comp);
    expect(detail.mentionsComponents).toEqual([{ name: "Link", slug: "link" }]);
  });

  it("defaults mentionsComponents to empty array when not attached", () => {
    const comp = makeComponent({ name: "Button", slug: "button" });
    const detail = toAgentDetail(comp);
    expect(detail.mentionsComponents).toEqual([]);
  });
});

// ── toIndexEntry ────────────────────────────────────────────

describe("toIndexEntry", () => {
  it("returns the expected fields", () => {
    const entry = toIndexEntry(makeComponent({ name: "Button", slug: "button" }));
    expect(entry).toEqual({
      name: "Button",
      slug: "button",
      type: "Component",
      tiers: "Global",
      description: "A test component for triggering actions.",
    });
  });

  it("includes full description, not just first sentence", () => {
    const comp = makeComponent({
      name: "Button",
      slug: "button",
      description: "First sentence. Second sentence with more detail.",
    });
    const entry = toIndexEntry(comp);
    expect(entry.description).toBe("First sentence. Second sentence with more detail.");
  });

  it("preserves component type", () => {
    const entry = toIndexEntry(makeComponent({ name: "Card", slug: "card", type: "Pattern" }));
    expect(entry.type).toBe("Pattern");
  });

  it("preserves component tiers", () => {
    const entry = toIndexEntry(makeComponent({ name: "Card", slug: "card", tiers: "Apps" }));
    expect(entry.tiers).toBe("Apps");
  });

  it("defaults empty description to empty string", () => {
    const comp = makeComponent({ name: "Plain", slug: "plain", description: "" });
    const entry = toIndexEntry(comp);
    expect(entry.description).toBe("");
  });

  it("does not include extra fields", () => {
    const entry = toIndexEntry(makeComponent({ name: "Button", slug: "button" }));
    expect(Object.keys(entry).sort()).toEqual(["description", "name", "slug", "tiers", "type"]);
  });
});
