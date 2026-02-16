import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeValue,
  normalizeRow,
  ImageCollector,
} from "../../src/api/normalize";
import {
  componentRow,
  propertyRow,
  changelogRow,
  editorRow,
  anatomyRow,
  documentationStatusRow,
} from "../fixtures/sample-rows";

describe("ImageCollector", () => {
  let collector: ImageCollector;

  beforeEach(() => {
    collector = new ImageCollector();
  });

  it("collects a new image and returns a local path", () => {
    const path = collector.collect(
      "https://codahosted.io/docs/dFakeDoc99/blobs/bl-toggle01/toggle.png"
    );
    expect(path).toMatch(/^images\/[\w-]+\.png$/);
  });

  it("returns the same path for duplicate URLs", () => {
    const url =
      "https://codahosted.io/docs/dFakeDoc99/blobs/bl-toggle01/toggle.png";
    const path1 = collector.collect(url);
    const path2 = collector.collect(url);
    expect(path1).toBe(path2);
  });

  it("assigns different paths for different URLs", () => {
    const path1 = collector.collect("https://codahosted.io/blobs/a/img.png");
    const path2 = collector.collect("https://codahosted.io/blobs/b/img.jpg");
    expect(path1).not.toBe(path2);
  });

  it("extracts extension from URL", () => {
    const path = collector.collect("https://codahosted.io/blobs/bl-x/photo.jpg");
    expect(path).toMatch(/\.jpg$/);
  });

  it("defaults to .png when URL has no extension", () => {
    const path = collector.collect(
      "https://codahosted.io/docs/dFakeDoc99/blobs/bl-abc123/d2150d01e0b6a064"
    );
    expect(path).toMatch(/\.png$/);
  });

  it("defaults to .png for invalid URLs", () => {
    const path = collector.collect("not-a-url");
    expect(path).toMatch(/\.png$/);
  });

  it("getAll returns all collected images", () => {
    collector.collect("https://codahosted.io/a.png");
    collector.collect("https://codahosted.io/b.jpg");
    collector.collect("https://codahosted.io/a.png"); // duplicate
    const all = collector.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].url).toBe("https://codahosted.io/a.png");
    expect(all[1].url).toBe("https://codahosted.io/b.jpg");
  });
});

describe("normalizeValue", () => {
  let collector: ImageCollector;

  beforeEach(() => {
    collector = new ImageCollector();
  });

  // ── Scalars ────────────────────────────────────────────────
  it("passes through null", () => {
    expect(normalizeValue(null, collector)).toBeNull();
  });

  it("passes through undefined", () => {
    expect(normalizeValue(undefined, collector)).toBeUndefined();
  });

  it("passes through empty string", () => {
    expect(normalizeValue("", collector)).toBe("");
  });

  it("passes through numbers", () => {
    expect(normalizeValue(1, collector)).toBe(1);
  });

  it("passes through booleans", () => {
    expect(normalizeValue(true, collector)).toBe(true);
    expect(normalizeValue(false, collector)).toBe(false);
  });

  // ── String processing ─────────────────────────────────────
  it("strips triple-backtick wrapping (as Coda rich format does)", () => {
    expect(normalizeValue("```Toggle switch```", collector)).toBe(
      "Toggle switch"
    );
  });

  it("does not strip partial backticks", () => {
    expect(normalizeValue("```Hello", collector)).toBe("```Hello");
  });

  it("passes through plain strings (some Coda values are not backtick-wrapped)", () => {
    expect(normalizeValue("Draft", collector)).toBe("Draft");
  });

  it("passes through ISO date strings", () => {
    expect(
      normalizeValue("2025-07-20T14:45:12.500+00:00", collector)
    ).toBe("2025-07-20T14:45:12.500+00:00");
  });

  it("replaces Unicode line terminators", () => {
    expect(normalizeValue("a\u2028b\u2029c", collector)).toBe("a\nb\nc");
  });

  // ── StructuredValue with rowId (relation column) ──────────
  it("extracts rowId from StructuredValue (real Coda shape)", () => {
    const value = componentRow.values["Documentation status"];
    expect(normalizeValue(value, collector)).toBe("i-stat01");
  });

  it("extracts rowId from single StructuredValue relation", () => {
    const value = componentRow.values.Type;
    expect(normalizeValue(value, collector)).toBe("i-type01");
  });

  // ── StructuredValue arrays (relation columns) ─────────────
  it("normalizes array of StructuredValues to rowId array", () => {
    const value = componentRow.values.Anatomy;
    const result = normalizeValue(value, collector) as string[];
    expect(result).toEqual(["i-an01", "i-an02"]);
  });

  it("normalizes empty relation arrays to empty arrays", () => {
    expect(normalizeValue(componentRow.values.Properties, collector)).toEqual(
      []
    );
  });

  // ── StructuredValue without rowId ─────────────────────────
  it("extracts trimmed name from StructuredValue without rowId", () => {
    const value = {
      "@type": "StructuredValue",
      name: "  Some label  ",
    };
    expect(normalizeValue(value, collector)).toBe("Some label");
  });

  // ── ImageObject (real Coda shape with height/width/status) ─
  it("collects ImageObject and returns local path", () => {
    const value = componentRow.values["Component example image"][0];
    const result = normalizeValue(value, collector);
    expect(result).toMatch(/^images\/[\w-]+\.png$/);
    expect(collector.getAll()).toHaveLength(1);
    expect(collector.getAll()[0].url).toBe(
      "https://codahosted.io/docs/dFakeDoc99/blobs/bl-toggle01/toggle-example.png"
    );
  });

  it("returns empty string for ImageObject without url", () => {
    const value = { "@type": "ImageObject", name: "broken.png" };
    expect(normalizeValue(value, collector)).toBe("");
  });

  // ── WebPage ───────────────────────────────────────────────
  it("extracts url from WebPage (Figma link)", () => {
    const value = componentRow.values.Figma;
    expect(normalizeValue(value, collector)).toBe(
      "https://www.figma.com/design/fakeFile123/My-Library"
    );
  });

  it("returns empty string for WebPage without url", () => {
    const value = { "@context": "http://schema.org/", "@type": "WebPage" };
    expect(normalizeValue(value, collector)).toBe("");
  });

  // ── Person type (editors table) ───────────────────────────
  it("extracts name from Person type (uses name fallback)", () => {
    const value = editorRow.values.Name;
    expect(normalizeValue(value, collector)).toBe("Alex Rivera");
  });

  // ── Arrays ────────────────────────────────────────────────
  it("normalizes arrays of ImageObjects", () => {
    const value = componentRow.values["Anatomy image"];
    const result = normalizeValue(value, collector) as string[];
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/^images\//);
  });

  it("normalizes mixed arrays", () => {
    const value = [
      "```plain```",
      {
        "@context": "http://schema.org/",
        "@type": "StructuredValue",
        additionalType: "row",
        name: "A",
        rowId: "i-row-a",
      },
      42,
    ];
    const result = normalizeValue(value, collector) as unknown[];
    expect(result).toEqual(["plain", "i-row-a", 42]);
  });

  // ── Unknown object with name ──────────────────────────────
  it("extracts name from unknown object type", () => {
    const value = { name: "Fallback Name" };
    expect(normalizeValue(value, collector)).toBe("Fallback Name");
  });

  // ── Unknown object without name ───────────────────────────
  it("returns raw object when no type or name", () => {
    const value = { foo: "bar" };
    expect(normalizeValue(value, collector)).toEqual({ foo: "bar" });
  });
});

describe("normalizeRow", () => {
  let collector: ImageCollector;

  beforeEach(() => {
    collector = new ImageCollector();
  });

  it("normalizes a full component row (the richest row type)", () => {
    const result = normalizeRow(
      componentRow.id,
      componentRow.values as Record<string, unknown>,
      collector
    );

    // Row ID
    expect(result.rowId).toBe("i-abc123def4");

    // Backtick-stripped name
    expect(result.name).toBe("Toggle switch");

    // StructuredValue → rowId
    expect(result.documentationStatus).toBe("i-stat01");
    expect(result.type).toBe("i-type01");
    expect(result.tiers).toBe("i-tier01");

    // Plain string (no backticks in rich format for long text)
    expect(result.usage).toBe(
      "Use the toggle switch when you need to let users turn a single option on or off instantly."
    );

    // WebPage → url
    expect(result.figma).toBe(
      "https://www.figma.com/design/fakeFile123/My-Library"
    );

    // Empty string passthrough
    expect(result.code).toBe("");
    expect(result.examples).toBe("");

    // ImageObject array → local paths
    expect(result.componentExampleImage).toHaveLength(1);
    expect((result.componentExampleImage as string[])[0]).toMatch(/^images\//);

    // StructuredValue array → rowId array
    expect(result.anatomy).toEqual(["i-an01", "i-an02"]);

    // Empty array
    expect(result.properties).toEqual([]);
    expect(result.decisionLog).toEqual([]);

    // Date string passthrough
    expect(result.lastEdited).toBe("2025-07-20T14:45:12.500+00:00");

    // Column name → camelCase (including hyphenated edge case)
    expect(result).toHaveProperty("changeLog");
    expect(result).toHaveProperty("anatomyImage");
    expect(result).toHaveProperty("sites-ArchitectureLevels");
    expect(result).toHaveProperty("uiBlocksUsedInPattern");

    // Images collected
    expect(collector.getAll()).toHaveLength(2); // example image + anatomy image
  });

  it("normalizes a property row with boolean and backtick strings", () => {
    const result = normalizeRow(
      propertyRow.id,
      propertyRow.values as Record<string, unknown>,
      collector
    );

    expect(result.rowId).toBe("i-prop55xyz");
    expect(result.name).toBe("Disabled");
    expect(result.required).toBe(false);
    expect(result.type).toBe("i-pt01");
    expect(result.description).toBe(
      "Prevents user interaction when set to true"
    );
    expect(result.constraint).toBe("Must be true or false");
    expect(result.options).toBe("true, false");
    expect(result.defaultOption).toBe("false");
    expect(result.component).toEqual(["i-abc123def4"]);
  });

  it("normalizes a changelog row with StructuredValue Construct and Who", () => {
    const result = normalizeRow(
      changelogRow.id,
      changelogRow.values as Record<string, unknown>,
      collector
    );

    expect(result.rowId).toBe("i-cl-entry07");
    // Construct is a StructuredValue (relation to component) → rowId
    expect(result.construct).toBe("i-abc123def4");
    expect(result.when).toBe("2025-08-01T11:00:00.000+00:00");
    expect(result.what).toBe(
      "Added accessibility notes and keyboard navigation details"
    );
    // Who is a StructuredValue (relation to editor) → rowId
    expect(result.who).toBe("i-ed02");
    expect(result.concept).toBe("");
  });

  it("normalizes an editor row with Person type", () => {
    const result = normalizeRow(
      editorRow.id,
      editorRow.values as Record<string, unknown>,
      collector
    );

    expect(result.rowId).toBe("i-ed02");
    // Person type → uses name fallback
    expect(result.name).toBe("Alex Rivera");
    // Changelog relation → rowId array
    expect(result.changelog).toEqual(["i-cl-entry07"]);
  });

  it("normalizes an anatomy row with numeric field", () => {
    const result = normalizeRow(
      anatomyRow.id,
      anatomyRow.values as Record<string, unknown>,
      collector
    );

    expect(result.rowId).toBe("i-an01");
    expect(result.number).toBe(1);
    expect(result.name).toBe("Track");
    expect(result.description).toBe(
      "The horizontal bar that visually represents the on and off states."
    );
    expect(result.component).toBe("i-abc123def4");
  });

  it("normalizes a documentation status row (plain Name, no backticks)", () => {
    const result = normalizeRow(
      documentationStatusRow.id,
      documentationStatusRow.values as Record<string, unknown>,
      collector
    );

    expect(result.rowId).toBe("i-stat01");
    // Name is plain string, not backtick-wrapped
    expect(result.name).toBe("Draft");
    // Multiline description (also plain string)
    expect(result.description).toContain("- Usage guidelines\n- Anatomy diagram");
    // Array of StructuredValues → rowIds
    expect(result.components).toEqual(["i-abc123def4", "i-comp02"]);
  });
});
