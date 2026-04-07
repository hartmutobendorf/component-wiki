import { describe, it, expect } from "vitest";
import { generateConceptMarkdown } from "../../src/utils/generate-concept-markdown.js";
import {
  minimalConcept,
  fullConcept,
  descriptionOnlyConcept,
  contentOnlyConcept,
} from "../fixtures/concept-data.js";

// ══════════════════════════════════════════════════════════════
// Title and Metadata
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — title and metadata", () => {
  it("starts with the concept name as h1", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).toMatch(/^# Spacing\n/);
  });

  it("includes type in metadata", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).toContain("- **Type:** Principle");
  });

  it("includes tier in metadata", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).toContain("- **Tier:** Global");
  });

  it("includes documentation status in metadata", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).toContain("- **Documentation Status:** All good");
  });

  it("includes last edited date in metadata", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).toContain("- **Last Edited:** 2025-02-20");
  });
});

// ══════════════════════════════════════════════════════════════
// Description
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — description", () => {
  it("includes description section when present", () => {
    const md = generateConceptMarkdown(descriptionOnlyConcept);
    expect(md).toContain("## Description\n\n");
    expect(md).toContain(
      "Typography defines the visual hierarchy through text styles.",
    );
  });

  it("omits description section when empty", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).not.toContain("## Description");
  });

  it("preserves markdown formatting in description", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("**form elements**");
  });
});

// ══════════════════════════════════════════════════════════════
// Content
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — content", () => {
  it("includes content section when present", () => {
    const md = generateConceptMarkdown(contentOnlyConcept);
    expect(md).toContain("## Content\n\n");
    expect(md).toContain(
      "Use the brand palette for primary actions and neutral tones for backgrounds.",
    );
  });

  it("omits content section when empty", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).not.toContain("## Content");
  });

  it("preserves markdown formatting in content", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("## Principles");
    expect(md).toContain("## Exceptions");
  });
});

// ══════════════════════════════════════════════════════════════
// Applied Rules
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — applied rules", () => {
  it("includes applied rules section when present", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("## Applied Rules\n\n");
    expect(md).toContain("| Rule | Strength | Status | Type |");
  });

  it("includes rule details", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("Labels must be above inputs");
    expect(md).toContain("Must");
    expect(md).toContain("Active");
    expect(md).toContain("Layout");
  });

  it("includes all rules", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("Error messages appear below inputs");
    expect(md).toContain("Should");
    expect(md).toContain("Validation");
  });

  it("omits applied rules section when empty", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).not.toContain("## Applied Rules");
  });
});

// ══════════════════════════════════════════════════════════════
// Change Log
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — change log", () => {
  it("includes change log section when present", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("## Change Log\n\n");
    expect(md).toContain("| Who | When | What |");
  });

  it("formats dates in en-GB long format", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("1. März 2025");
    expect(md).toContain("10. Mai 2025");
  });

  it("includes who and what fields", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("Alice");
    expect(md).toContain("Initial concept creation");
    expect(md).toContain("Charlie");
    expect(md).toContain("Added multi-column exception");
  });

  it("omits change log section when empty", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).not.toContain("## Change Log");
  });
});

// ══════════════════════════════════════════════════════════════
// Decision Log
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — decision log", () => {
  it("includes decision log section when present", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("## Decision Log\n\n");
    expect(md).toContain("| Where | What | Link | When |");
  });

  it("renders link as markdown link when present", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("[View](https://example.com/decision/456)");
  });

  it("renders '-' when link is empty", () => {
    const md = generateConceptMarkdown(fullConcept);
    const auditLine = md
      .split("\n")
      .find((l) => l.includes("Allow inline field groups"));
    expect(auditLine).toContain("| - |");
  });

  it("includes where and what fields", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("Design review");
    expect(md).toContain("Single column default");
    expect(md).toContain("UX audit");
    expect(md).toContain("Allow inline field groups");
  });

  it("omits decision log section when empty", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).not.toContain("## Decision Log");
  });
});

// ══════════════════════════════════════════════════════════════
// Mentioned In
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — mentioned in", () => {
  it("includes mentioned in section when present", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("## Mentioned In\n\n");
  });

  it("renders each mention as a markdown link", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("- [Input](/global/construct/input)");
    expect(md).toContain("- [Select](/global/construct/select)");
  });

  it("omits mentioned in section when empty", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).not.toContain("## Mentioned In");
  });
});

// ══════════════════════════════════════════════════════════════
// References (mentionsComponents)
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — references", () => {
  it("includes references section when present", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("## References\n\n");
  });

  it("renders each reference as a markdown link", () => {
    const md = generateConceptMarkdown(fullConcept);
    expect(md).toContain("- [Button](/global/construct/button)");
    expect(md).toContain("- [Input](/global/construct/input)");
  });

  it("deduplicates references by slug", () => {
    const md = generateConceptMarkdown(fullConcept);
    const buttonMatches = md.match(/- \[Button\]\(\/global\/construct\/button\)/g);
    expect(buttonMatches).toHaveLength(1);
  });

  it("omits references section when empty", () => {
    const md = generateConceptMarkdown(minimalConcept);
    expect(md).not.toContain("## References");
  });
});

// ══════════════════════════════════════════════════════════════
// Minimal concept (full structure test)
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — minimal concept", () => {
  it("generates only title and metadata for minimal concept", () => {
    const md = generateConceptMarkdown(minimalConcept);

    expect(md).toContain("# Spacing");
    expect(md).toContain("- **Type:** Principle");
    expect(md).toContain("- **Tier:** Global");

    expect(md).not.toContain("## Description");
    expect(md).not.toContain("## Content");
    expect(md).not.toContain("## Applied Rules");
    expect(md).not.toContain("## Change Log");
    expect(md).not.toContain("## Decision Log");
    expect(md).not.toContain("## Mentioned In");
    expect(md).not.toContain("## References");
  });
});

// ══════════════════════════════════════════════════════════════
// Section ordering
// ══════════════════════════════════════════════════════════════

describe("generateConceptMarkdown — section ordering", () => {
  it("outputs sections in correct order", () => {
    const md = generateConceptMarkdown(fullConcept);

    const titlePos = md.indexOf("# Form Layout");
    const descPos = md.indexOf("## Description");
    const contentPos = md.indexOf("## Content");
    const rulesPos = md.indexOf("## Applied Rules");
    const changeLogPos = md.indexOf("## Change Log");
    const decisionLogPos = md.indexOf("## Decision Log");
    const mentionedInPos = md.indexOf("## Mentioned In");
    const referencesPos = md.indexOf("## References");

    expect(titlePos).toBeLessThan(descPos);
    expect(descPos).toBeLessThan(contentPos);
    expect(contentPos).toBeLessThan(rulesPos);
    expect(rulesPos).toBeLessThan(changeLogPos);
    expect(changeLogPos).toBeLessThan(decisionLogPos);
    expect(decisionLogPos).toBeLessThan(mentionedInPos);
    expect(mentionedInPos).toBeLessThan(referencesPos);
  });
});
