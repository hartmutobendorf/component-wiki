import { describe, it, expect } from "vitest";
import { generateComponentMarkdown } from "../../src/utils/generate-component-markdown.js";
import {
  minimalComponent,
  fullComponent,
  descriptionOnlyComponent,
  anatomyNoImageComponent,
  emptyAnatomyComponent,
} from "../fixtures/component-data.js";

// ══════════════════════════════════════════════════════════════
// Title and Metadata
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — title and metadata", () => {
  it("starts with the component name as h1", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).toMatch(/^# Button\n/);
  });

  it("includes type in metadata", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).toContain("- **Type:** Component");
  });

  it("includes tier in metadata", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).toContain("- **Tier:** Global");
  });

  it("includes documentation status in metadata", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).toContain("- **Documentation Status:** All good");
  });

  it("includes last edited date in metadata", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).toContain("- **Last Edited:** 2025-01-15");
  });

  it("includes figma link when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain(
      "- **Figma:** https://figma.com/file/abc123",
    );
  });

  it("includes code link when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain(
      "- **Code:** https://github.com/org/repo/tree/main/src/toggle",
    );
  });

  it("omits figma link when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("**Figma:**");
  });

  it("omits code link when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("**Code:**");
  });
});

// ══════════════════════════════════════════════════════════════
// Description
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — description", () => {
  it("includes description section when present", () => {
    const md = generateComponentMarkdown(descriptionOnlyComponent);
    expect(md).toContain("## Description\n\n");
    expect(md).toContain(
      "A horizontal line to separate content sections.",
    );
  });

  it("omits description section when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("## Description");
  });

  it("preserves markdown formatting in description", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("**turn something on or off**");
  });
});

// ══════════════════════════════════════════════════════════════
// Anatomy
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — anatomy", () => {
  it("includes anatomy section with table when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("## Anatomy\n\n");
    expect(md).toContain("| # | Name | Description |");
    expect(md).toContain("|---|------|-------------|");
  });

  it("sorts anatomy parts by number", () => {
    const md = generateComponentMarkdown(fullComponent);
    const trackPos = md.indexOf("| 1 | Track |");
    const thumbPos = md.indexOf("| 2 | Thumb |");
    const labelPos = md.indexOf("| 3 | Label |");
    expect(trackPos).toBeLessThan(thumbPos);
    expect(thumbPos).toBeLessThan(labelPos);
  });

  it("includes all anatomy part details", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("Track");
    expect(md).toContain("The background rail the thumb moves along.");
    expect(md).toContain("Thumb");
    expect(md).toContain("The circular indicator that slides.");
  });

  it("includes anatomy even without image", () => {
    const md = generateComponentMarkdown(anatomyNoImageComponent);
    expect(md).toContain("## Anatomy");
    expect(md).toContain("Container");
    expect(md).toContain("Label");
  });

  it("omits anatomy section when table is empty", () => {
    const md = generateComponentMarkdown(emptyAnatomyComponent);
    expect(md).not.toContain("## Anatomy");
  });

  it("omits anatomy section when anatomy is undefined", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("## Anatomy");
  });
});

// ══════════════════════════════════════════════════════════════
// Usage and Examples
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — usage and examples", () => {
  it("includes usage section when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("## Usage\n\n");
    expect(md).toContain(
      "Use toggle switches when the user needs to toggle a single setting.",
    );
  });

  it("omits usage section when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("## Usage");
  });

  it("includes examples section when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("## Examples\n\n");
    expect(md).toContain("### Basic Toggle");
  });

  it("omits examples section when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("## Examples");
  });
});

// ══════════════════════════════════════════════════════════════
// Properties
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — properties", () => {
  it("includes properties table when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("## Properties\n\n");
    expect(md).toContain(
      "| Name | Type | Required | Description | Constraint | Options | Default |",
    );
  });

  it("shows required properties as 'Yes'", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain(
      "| checked | boolean | Yes | Whether the toggle is on or off. |",
    );
  });

  it("shows non-required properties as 'No'", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("| disabled | boolean | No |");
  });

  it("joins options with commas", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("small, medium, large");
  });

  it("shows '-' for empty options", () => {
    const md = generateComponentMarkdown(fullComponent);
    // checked has no options
    const checkedLine = md
      .split("\n")
      .find((l) => l.startsWith("| checked |"));
    expect(checkedLine).toContain("| - |");
  });

  it("shows '-' for empty description", () => {
    const comp = {
      ...minimalComponent,
      properties: [
        {
          name: "test",
          required: false,
          type: "string" as const,
          description: "",
          constraint: "",
          defaultOption: "",
          options: [],
        },
      ],
    };
    const md = generateComponentMarkdown(comp);
    expect(md).toContain("| test | string | No | - | - | - | - |");
  });

  it("shows default option value", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("| medium |");
  });

  it("shows constraint value", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("Must be one of the listed options");
  });

  it("omits properties section when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("## Properties");
  });
});

// ══════════════════════════════════════════════════════════════
// Child Properties
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — child properties", () => {
  it("includes child properties section when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("### Child Properties\n\n");
  });

  it("shows child component name as h4", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("#### Toggle Label\n\n");
  });

  it("includes child property table with headers", () => {
    const md = generateComponentMarkdown(fullComponent);
    // There should be at least 2 property tables (main + child)
    const headerMatches = md.match(
      /\| Name \| Type \| Required \| Description \| Constraint \| Options \| Default \|/g,
    );
    expect(headerMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it("shows child property details", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("| text | string | Yes |");
    expect(md).toContain("left, right");
  });

  it("omits child properties section when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("### Child Properties");
  });
});

// ══════════════════════════════════════════════════════════════
// Change Log
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — change log", () => {
  it("includes change log section when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("## Change Log\n\n");
    expect(md).toContain("| Who | When | What |");
  });

  it("formats dates in en-US locale", () => {
    const md = generateComponentMarkdown(fullComponent);
    // 2025-01-10 → "Jan 10, 2025"
    expect(md).toContain("Jan 10, 2025");
    // 2025-03-15 → "Mar 15, 2025"
    expect(md).toContain("Mar 15, 2025");
  });

  it("includes who and what fields", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("Alice");
    expect(md).toContain("Initial component creation");
    expect(md).toContain("Bob");
    expect(md).toContain("Added disabled state");
  });

  it("omits change log section when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("## Change Log");
  });
});

// ══════════════════════════════════════════════════════════════
// Decision Log
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — decision log", () => {
  it("includes decision log section when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("## Decision Log\n\n");
    expect(md).toContain("| Where | What | Link | When |");
  });

  it("renders link as markdown link when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain(
      "[View](https://example.com/meeting/123)",
    );
  });

  it("renders '-' when link is empty", () => {
    const md = generateComponentMarkdown(fullComponent);
    // The "Add ARIA attributes" entry has no link
    const ariaLine = md
      .split("\n")
      .find((l) => l.includes("Add ARIA attributes"));
    expect(ariaLine).toContain("| - |");
  });

  it("includes where and decision made fields", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("Design review");
    expect(md).toContain("Use rounded thumb style");
    expect(md).toContain("Accessibility audit");
    expect(md).toContain("Add ARIA attributes");
  });

  it("omits decision log section when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("## Decision Log");
  });
});

// ══════════════════════════════════════════════════════════════
// Minimal component (full structure test)
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — minimal component", () => {
  it("generates only title and metadata for minimal component", () => {
    const md = generateComponentMarkdown(minimalComponent);

    // Should have title and metadata
    expect(md).toContain("# Button");
    expect(md).toContain("- **Type:** Component");
    expect(md).toContain("- **Tier:** Global");

    // Should NOT have any optional sections
    expect(md).not.toContain("## Description");
    expect(md).not.toContain("## Anatomy");
    expect(md).not.toContain("## Usage");
    expect(md).not.toContain("## Examples");
    expect(md).not.toContain("## Properties");
    expect(md).not.toContain("### Child Properties");
    expect(md).not.toContain("## Change Log");
    expect(md).not.toContain("## Decision Log");
  });
});

// ══════════════════════════════════════════════════════════════
// Full component (ordering test)
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// Mentioned In
// ══════════════════════════════════════════════════════════════

describe("generateComponentMarkdown — mentioned in", () => {
  it("includes mentioned in section when present", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("## Mentioned In\n\n");
  });

  it("renders each mention as a markdown link", () => {
    const md = generateComponentMarkdown(fullComponent);
    expect(md).toContain("- [Form placement](/form-placement)");
    expect(md).toContain("- [Settings page](/settings-page)");
  });

  it("omits mentioned in section when empty", () => {
    const md = generateComponentMarkdown(minimalComponent);
    expect(md).not.toContain("## Mentioned In");
  });
});

describe("generateComponentMarkdown — section ordering", () => {
  it("outputs sections in correct order", () => {
    const md = generateComponentMarkdown(fullComponent);

    const titlePos = md.indexOf("# Toggle Switch");
    const descPos = md.indexOf("## Description");
    const anatomyPos = md.indexOf("## Anatomy");
    const usagePos = md.indexOf("## Usage");
    const examplesPos = md.indexOf("## Examples");
    const propsPos = md.indexOf("## Properties");
    const childPropsPos = md.indexOf("### Child Properties");
    const changeLogPos = md.indexOf("## Change Log");
    const decisionLogPos = md.indexOf("## Decision Log");
    const mentionedInPos = md.indexOf("## Mentioned In");

    expect(titlePos).toBeLessThan(descPos);
    expect(descPos).toBeLessThan(anatomyPos);
    expect(anatomyPos).toBeLessThan(usagePos);
    expect(usagePos).toBeLessThan(examplesPos);
    expect(examplesPos).toBeLessThan(propsPos);
    expect(propsPos).toBeLessThan(childPropsPos);
    expect(childPropsPos).toBeLessThan(changeLogPos);
    expect(changeLogPos).toBeLessThan(decisionLogPos);
    expect(decisionLogPos).toBeLessThan(mentionedInPos);
  });
});
