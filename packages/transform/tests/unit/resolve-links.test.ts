import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveAllWikiRefs } from "../../src/common/resolve-links.js";
import type { SyncConfig } from "../../src/common/types.js";

let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
});

const config: SyncConfig = {
  baseUrl: "https://coda.io/apis/v1",
  docId: "test-doc",
  tables: {
    construct: { id: "grid-comp" },
    constructProperties: { id: "grid-prop" },
    constructAnatomy: { id: "grid-anat" },
    documentationChangelog: { id: "grid-cl" },
    documentationDecisionlog: { id: "grid-dl" },
    concepts: { id: "grid-conc" },
  },
};

const allRawTables: Record<string, { rows: Record<string, Record<string, unknown>> }> = {
  construct: {
    rows: {
      "i-checkbox": { rowId: "i-checkbox", name: "Checkbox" },
      "i-button": { rowId: "i-button", name: "Button" },
      "i-cta-block": { rowId: "i-cta-block", name: "CTA block" },
    },
  },
  constructProperties: {
    rows: {
      "i-size": { rowId: "i-size", name: "Size", component: ["i-button"] },
      "i-checked": { rowId: "i-checked", name: "checked", component: ["i-checkbox"] },
    },
  },
  constructAnatomy: {
    rows: {
      "i-anat1": { rowId: "i-anat1", name: "Container", component: "i-button" },
    },
  },
  documentationChangelog: {
    rows: {
      "i-cl1": { rowId: "i-cl1", construct: "i-button", what: "Initial docs" },
    },
  },
  documentationDecisionlog: {
    rows: {
      "i-dl1": { rowId: "i-dl1", construct: "i-checkbox", where: "Review" },
    },
  },
  concepts: {
    rows: {
      "i-site": { rowId: "i-site", name: "Site" },
      "i-page": { rowId: "i-page", name: "Page" },
    },
  },
};

describe("resolveAllWikiRefs — construct links", () => {
  it("resolves a construct wiki-ref to /slug", () => {
    const result = resolveAllWikiRefs(
      { description: "Use [Checkbox](wiki-ref://grid-comp/i-checkbox) for filters", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("Use [Checkbox](/checkbox) for filters");
  });

  it("generates correct slug for multi-word names", () => {
    const result = resolveAllWikiRefs(
      { description: "See [CTA block](wiki-ref://grid-comp/i-cta-block) here", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("See [CTA block](/cta-block) here");
  });

  it("resolves links in all fields", () => {
    const ref = "[Button](wiki-ref://grid-comp/i-button)";
    const result = resolveAllWikiRefs(
      { description: `Desc ${ref}`, usage: `Usage ${ref}`, examples: `Ex ${ref}` },
      config,
      allRawTables
    );
    expect(result.description).toContain("[Button](/button)");
    expect(result.usage).toContain("[Button](/button)");
    expect(result.examples).toContain("[Button](/button)");
  });
});

describe("resolveAllWikiRefs — concept links", () => {
  it("resolves a concept wiki-ref to /slug", () => {
    const result = resolveAllWikiRefs(
      { description: "See [Site](wiki-ref://grid-conc/i-site) for details", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("See [Site](/site) for details");
  });
});

describe("resolveAllWikiRefs — non-primary table links", () => {
  it("links property to parent construct's #properties section", () => {
    const result = resolveAllWikiRefs(
      { description: "The [Size](wiki-ref://grid-prop/i-size) property", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("The [Size](/button#properties) property");
  });

  it("links anatomy to parent construct's #anatomy section", () => {
    const result = resolveAllWikiRefs(
      { description: "The [Container](wiki-ref://grid-anat/i-anat1) wraps.", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("The [Container](/button#anatomy) wraps.");
  });

  it("links changelog to parent's #changelog section", () => {
    const result = resolveAllWikiRefs(
      { description: "See [Initial docs](wiki-ref://grid-cl/i-cl1).", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("See [Initial docs](/button#changelog).");
  });

  it("links decision log to parent's #decisionlog section", () => {
    const result = resolveAllWikiRefs(
      { description: "See [Review](wiki-ref://grid-dl/i-dl1).", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("See [Review](/checkbox#decisionlog).");
  });
});

describe("resolveAllWikiRefs — content field", () => {
  it("resolves wiki-refs in content field", () => {
    const result = resolveAllWikiRefs(
      { description: "", usage: "", examples: "", content: "See [Button](wiki-ref://grid-comp/i-button)." },
      config,
      allRawTables
    );
    expect(result.content).toBe("See [Button](/button).");
  });
});

describe("resolveAllWikiRefs — missing references", () => {
  it("renders plain text for unknown table ID", () => {
    const result = resolveAllWikiRefs(
      { description: "See [Foo](wiki-ref://grid-unknown/i-bar) here", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("See Foo here");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("renders plain text for missing row ID", () => {
    const result = resolveAllWikiRefs(
      { description: "See [Missing](wiki-ref://grid-comp/i-nonexistent) here", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("See Missing here");
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("resolveAllWikiRefs — pass-through", () => {
  it("leaves external URLs untouched", () => {
    const result = resolveAllWikiRefs(
      { description: "[Vanilla](https://vanillaframework.io/docs)", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("[Vanilla](https://vanillaframework.io/docs)");
  });

  it("returns empty strings unchanged", () => {
    const result = resolveAllWikiRefs(
      { description: "", usage: "", examples: "" },
      config,
      allRawTables
    );
    expect(result.description).toBe("");
  });
});
