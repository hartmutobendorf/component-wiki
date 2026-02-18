import { describe, it, expect } from "vitest";
import { toAgentConstructDetail, toConstructIndexEntry, toAgentConceptDetail, toConceptIndexEntry } from "../../src/targets/agent.js";
import type { Construct, Concept } from "@wiki/shared";

function makeConstruct(
  overrides: Partial<Construct> & { name: string; slug: string }
): Construct {
  return {
    type: "Component",
    tiers: "Global",
    documentationStatus: "All good",
    lastEdited: "2025-06-15T10:00:00.000Z",
    figmaLink: "https://figma.com/file/abc",
    codeLink: "https://github.com/org/repo",
    description: "A test construct for triggering actions.",
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
    appliedRules: [],
    exceptionFromRules: [],
    mentionedIn: [],
    ...overrides,
  };
}

function makeConcept(
  overrides: Partial<Concept> & { name: string; slug: string }
): Concept {
  return {
    type: "Decision guide",
    tier: "Global",
    documentationStatus: "All good",
    lastEdited: "2026-02-18T09:29:54.400+00:00",
    description: "A test concept.",
    content: "Detailed content.",
    changeLog: [],
    decisionLog: [],
    appliedRules: [],
    exceptedFromRules: [],
    ...overrides,
  };
}

// ── toAgentConstructDetail ──────────────────────────────────

describe("toAgentConstructDetail", () => {
  it("strips figmaComponentData", () => {
    const detail = toAgentConstructDetail(makeConstruct({ name: "Button", slug: "button" }));
    expect(detail).not.toHaveProperty("figmaComponentData");
  });

  it("strips componentExampleImage", () => {
    const detail = toAgentConstructDetail(makeConstruct({ name: "Button", slug: "button" }));
    expect(detail).not.toHaveProperty("componentExampleImage");
  });

  it("strips anatomy.image but preserves anatomy.table", () => {
    const c = makeConstruct({
      name: "Button",
      slug: "button",
      anatomy: {
        image: "images/anatomy.png",
        table: [{ number: 1, name: "Container", description: "The wrapper." }],
      },
    });
    const detail = toAgentConstructDetail(c);
    const anatomy = detail.anatomy as { image?: string; table: unknown[] };
    expect(anatomy.image).toBeUndefined();
    expect(anatomy.table).toHaveLength(1);
  });

  it("adds url field", () => {
    const detail = toAgentConstructDetail(makeConstruct({ name: "Button", slug: "button" }));
    expect(detail.url).toBe("https://component.wiki/button");
  });

  it("preserves non-stripped fields", () => {
    const detail = toAgentConstructDetail(makeConstruct({ name: "Button", slug: "button" }));
    expect(detail.name).toBe("Button");
    expect(detail.description).toBe("A test construct for triggering actions.");
  });

  it("defaults mentionsComponents to empty array", () => {
    const detail = toAgentConstructDetail(makeConstruct({ name: "Button", slug: "button" }));
    expect(detail.mentionsComponents).toEqual([]);
  });
});

// ── toConstructIndexEntry ───────────────────────────────────

describe("toConstructIndexEntry", () => {
  it("returns expected fields", () => {
    const entry = toConstructIndexEntry(makeConstruct({ name: "Button", slug: "button" }));
    expect(entry).toEqual({
      name: "Button",
      slug: "button",
      type: "Component",
      tiers: "Global",
      description: "A test construct for triggering actions.",
    });
  });

  it("does not include extra fields", () => {
    const entry = toConstructIndexEntry(makeConstruct({ name: "Button", slug: "button" }));
    expect(Object.keys(entry).sort()).toEqual(["description", "name", "slug", "tiers", "type"]);
  });
});

// ── toAgentConceptDetail ────────────────────────────────────

describe("toAgentConceptDetail", () => {
  it("adds url field", () => {
    const detail = toAgentConceptDetail(makeConcept({ name: "Site", slug: "site" }));
    expect(detail.url).toBe("https://component.wiki/site");
  });

  it("preserves all fields", () => {
    const detail = toAgentConceptDetail(makeConcept({ name: "Site", slug: "site" }));
    expect(detail.name).toBe("Site");
    expect(detail.description).toBe("A test concept.");
    expect(detail.content).toBe("Detailed content.");
  });
});

// ── toConceptIndexEntry ─────────────────────────────────────

describe("toConceptIndexEntry", () => {
  it("returns expected fields", () => {
    const entry = toConceptIndexEntry(makeConcept({ name: "Site", slug: "site" }));
    expect(entry).toEqual({
      name: "Site",
      slug: "site",
      type: "Decision guide",
      tier: "Global",
      description: "A test concept.",
    });
  });

  it("does not include extra fields", () => {
    const entry = toConceptIndexEntry(makeConcept({ name: "Site", slug: "site" }));
    expect(Object.keys(entry).sort()).toEqual(["description", "name", "slug", "tier", "type"]);
  });
});
