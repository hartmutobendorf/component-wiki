import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveAllWikiRefs } from "../../src/common/resolve-links.js";
import type { SyncConfig } from "../../src/common/types.js";

// Suppress console.warn in tests (resolve emits warnings for missing refs)
let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
});

// ── Test fixtures ───────────────────────────────────────────

const config: SyncConfig = {
  baseUrl: "https://coda.io/apis/v1",
  docId: "test-doc",
  tables: {
    components: { id: "grid-comp" },
    properties: { id: "grid-prop" },
    anatomy: { id: "grid-anat" },
    changelog: { id: "grid-cl" },
    decisionLog: { id: "grid-dl" },
  },
};

const allRawTables: Record<
  string,
  { rows: Record<string, Record<string, unknown>> }
> = {
  components: {
    rows: {
      "i-checkbox": { rowId: "i-checkbox", name: "Checkbox" },
      "i-button": { rowId: "i-button", name: "Button" },
      "i-cta-block": { rowId: "i-cta-block", name: "CTA block" },
    },
  },
  properties: {
    rows: {
      "i-size": { rowId: "i-size", name: "Size", component: ["i-button"] },
      "i-checked": { rowId: "i-checked", name: "checked", component: ["i-checkbox"] },
    },
  },
  anatomy: {
    rows: {
      "i-anat1": { rowId: "i-anat1", name: "Container", component: "i-button" },
    },
  },
  changelog: {
    rows: {
      "i-cl1": { rowId: "i-cl1", name: "i-button", what: "Initial docs" },
    },
  },
  decisionLog: {
    rows: {
      "i-dl1": { rowId: "i-dl1", component: "i-checkbox", where: "Review" },
    },
  },
};

// ── Component links ─────────────────────────────────────────

describe("resolveAllWikiRefs — component links", () => {
  it("resolves a component wiki-ref to /slug", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "Use [Checkbox](wiki-ref://grid-comp/i-checkbox) for filters",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe("Use [Checkbox](/checkbox) for filters");
  });

  it("generates correct slug for multi-word names", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "See [CTA block](wiki-ref://grid-comp/i-cta-block) here",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe("See [CTA block](/cta-block) here");
  });

  it("resolves links in all three fields", () => {
    const ref = "[Button](wiki-ref://grid-comp/i-button)";
    const result = resolveAllWikiRefs(
      {
        description: `Desc ${ref}`,
        usage: `Usage ${ref}`,
        examples: `Examples ${ref}`,
      },
      config,
      allRawTables
    );
    expect(result.description).toContain("[Button](/button)");
    expect(result.usage).toContain("[Button](/button)");
    expect(result.examples).toContain("[Button](/button)");
  });

  it("resolves multiple links in a single field", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "[Checkbox](wiki-ref://grid-comp/i-checkbox) and [Button](wiki-ref://grid-comp/i-button)",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe(
      "[Checkbox](/checkbox) and [Button](/button)"
    );
  });
});

// ── Non-component links ─────────────────────────────────────

describe("resolveAllWikiRefs — non-component links", () => {
  it("links property to parent component's #properties section", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "The [Size](wiki-ref://grid-prop/i-size) property controls...",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe(
      "The [Size](/button#properties) property controls..."
    );
  });

  it("links property to correct parent when component differs", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "See [checked](wiki-ref://grid-prop/i-checked) for details.",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe(
      "See [checked](/checkbox#properties) for details."
    );
  });

  it("links anatomy part to parent component's #anatomy section", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "The [Container](wiki-ref://grid-anat/i-anat1) wraps everything.",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe(
      "The [Container](/button#anatomy) wraps everything."
    );
  });

  it("links changelog entry to parent component's #changelog section", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "See [Initial docs](wiki-ref://grid-cl/i-cl1) for history.",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe(
      "See [Initial docs](/button#changelog) for history."
    );
  });

  it("links decision log entry to parent component's #decisionlog section", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "See [Review](wiki-ref://grid-dl/i-dl1) for context.",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe(
      "See [Review](/checkbox#decisionlog) for context."
    );
  });

  it("falls back to plain text when parent component cannot be resolved", () => {
    const tables = structuredClone(allRawTables);
    // Property with a component ref that doesn't exist in the components table
    tables.properties.rows["i-orphan"] = {
      rowId: "i-orphan",
      name: "orphanProp",
      component: ["i-nonexistent"],
    };
    const result = resolveAllWikiRefs(
      {
        description:
          "The [orphanProp](wiki-ref://grid-prop/i-orphan) is lost.",
        usage: "",
        examples: "",
      },
      config,
      tables
    );
    expect(result.description).toBe("The orphanProp is lost.");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("could not resolve parent component")
    );
  });
});

// ── Missing / unknown references ────────────────────────────

describe("resolveAllWikiRefs — missing references", () => {
  it("renders plain text and warns for unknown table ID", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "See [Foo](wiki-ref://grid-unknown/i-bar) here",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe("See Foo here");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('unknown table ID "grid-unknown"')
    );
  });

  it("renders plain text and warns for missing row ID", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "See [Missing](wiki-ref://grid-comp/i-nonexistent) here",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe("See Missing here");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('row "i-nonexistent" not found')
    );
  });
});

// ── Pass-through / edge cases ───────────────────────────────

describe("resolveAllWikiRefs — pass-through", () => {
  it("leaves external URLs untouched", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "[Vanilla](https://vanillaframework.io/docs) is great",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe(
      "[Vanilla](https://vanillaframework.io/docs) is great"
    );
  });

  it("leaves image links untouched", () => {
    const result = resolveAllWikiRefs(
      {
        description: "![img](images/abc.png)",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe("![img](images/abc.png)");
  });

  it("returns empty strings unchanged", () => {
    const result = resolveAllWikiRefs(
      { description: "", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("");
    expect(result.usage).toBe("");
    expect(result.examples).toBe("");
  });

  it("returns text without links unchanged", () => {
    const text = "Just plain text with **bold** and _italic_.";
    const result = resolveAllWikiRefs(
      { description: text, usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe(text);
  });

  it("preserves surrounding markdown formatting", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "### Heading\n\nText with **bold** and [Checkbox](wiki-ref://grid-comp/i-checkbox).\n\n* List item",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toContain("### Heading");
    expect(result.description).toContain("**bold**");
    expect(result.description).toContain("[Checkbox](/checkbox)");
    expect(result.description).toContain("* List item");
  });

  it("handles mixed wiki-ref and external links", () => {
    const result = resolveAllWikiRefs(
      {
        description:
          "[Checkbox](wiki-ref://grid-comp/i-checkbox) and [NNGroup](https://www.nngroup.com)",
        usage: "",
        examples: "",
      },
      config,
      allRawTables
    );
    expect(result.description).toBe(
      "[Checkbox](/checkbox) and [NNGroup](https://www.nngroup.com)"
    );
  });
});

// ── Integration with denormalize ────────────────────────────

describe("resolveAllWikiRefs — denormalize integration", () => {
  it("works with the fixture data from denormalize tests", () => {
    // Simulate a component with wiki-ref links in its fields
    const fields = {
      description:
        "Use [Button](wiki-ref://grid-comp/i-button) for primary actions.",
      usage:
        "Combine with [Checkbox](wiki-ref://grid-comp/i-checkbox) for forms.",
      examples: "No links here.",
    };
    const result = resolveAllWikiRefs(fields, config, allRawTables);
    expect(result.description).toBe(
      "Use [Button](/button) for primary actions."
    );
    expect(result.usage).toBe(
      "Combine with [Checkbox](/checkbox) for forms."
    );
    expect(result.examples).toBe("No links here.");
  });
});
