import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractMarkdownLinks,
  parseCodaUrl,
  rewriteLinksToWikiRef,
  rewriteLinksWithApiPairing,
} from "../../src/links/resolve";

// ── extractMarkdownLinks ────────────────────────────────────

describe("extractMarkdownLinks", () => {
  it("extracts a single link", () => {
    const links = extractMarkdownLinks("See [Checkbox](https://coda.io/test)");
    expect(links).toHaveLength(1);
    expect(links[0].text).toBe("Checkbox");
    expect(links[0].url).toBe("https://coda.io/test");
    expect(links[0].position).toBe(0);
  });

  it("extracts multiple links with correct positions", () => {
    const links = extractMarkdownLinks(
      "[A](https://a.com) then [B](https://b.com) then [C](https://c.com)"
    );
    expect(links).toHaveLength(3);
    expect(links[0].text).toBe("A");
    expect(links[0].position).toBe(0);
    expect(links[1].text).toBe("B");
    expect(links[1].position).toBe(1);
    expect(links[2].text).toBe("C");
    expect(links[2].position).toBe(2);
  });

  it("skips image links (![alt](src))", () => {
    const links = extractMarkdownLinks(
      "![image](images/a.png) and [Link](https://example.com)"
    );
    expect(links).toHaveLength(1);
    expect(links[0].text).toBe("Link");
  });

  it("returns empty array for text with no links", () => {
    expect(extractMarkdownLinks("Just plain text")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(extractMarkdownLinks("")).toEqual([]);
  });

  it("captures start and end indices", () => {
    const md = "Start [Link](https://x.com) end";
    const links = extractMarkdownLinks(md);
    expect(links).toHaveLength(1);
    expect(md.substring(links[0].startIndex, links[0].endIndex)).toBe(
      "[Link](https://x.com)"
    );
  });

  it("handles links with empty text", () => {
    const links = extractMarkdownLinks("[](https://example.com)");
    expect(links).toHaveLength(1);
    expect(links[0].text).toBe("");
  });

  it("handles links adjacent to image links", () => {
    const links = extractMarkdownLinks(
      "![img](a.png)[Real link](https://example.com)"
    );
    expect(links).toHaveLength(1);
    expect(links[0].text).toBe("Real link");
  });
});

// ── parseCodaUrl ────────────────────────────────────────────

describe("parseCodaUrl", () => {
  it("parses a standard Coda API rich format URL", () => {
    const result = parseCodaUrl(
      "https://coda.io/d/_d_MEO4xiNKu#_tugrid-ymtdOF6n4R/_rui-hES7I02ImG"
    );
    expect(result).toEqual({
      tableId: "grid-ymtdOF6n4R",
      rowId: "i-hES7I02ImG",
    });
  });

  it("returns null for non-Coda URLs", () => {
    expect(parseCodaUrl("https://example.com/page")).toBeNull();
    expect(parseCodaUrl("https://google.com")).toBeNull();
  });

  it("returns null for Coda URLs without table/row fragment", () => {
    expect(parseCodaUrl("https://coda.io/d/_d_MEO4xiNKu")).toBeNull();
  });

  it("returns null for Coda URLs with fragment but no table pattern", () => {
    expect(parseCodaUrl("https://coda.io/d/_d_MEO4xiNKu#something")).toBeNull();
  });

  it("returns null for Coda URLs with table but no row pattern", () => {
    expect(
      parseCodaUrl("https://coda.io/d/_d_MEO4xiNKu#_tugrid-ymtdOF6n4R")
    ).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseCodaUrl("")).toBeNull();
  });

  it("handles different table and row ID formats", () => {
    const result = parseCodaUrl(
      "https://coda.io/d/_d_abc#_tugrid-9IKJO03-mN/_rui-xyz123ABC"
    );
    expect(result).toEqual({
      tableId: "grid-9IKJO03-mN",
      rowId: "i-xyz123ABC",
    });
  });
});

// ── rewriteLinksToWikiRef ───────────────────────────────────

describe("rewriteLinksToWikiRef", () => {
  it("rewrites a single Coda link to wiki-ref://", () => {
    const md =
      "See [Checkbox](https://coda.io/d/_d_MEO4xiNKu#_tugrid-ymtdOF6n4R/_rui-hES7I02ImG) here";
    const result = rewriteLinksToWikiRef(md);
    expect(result).toBe(
      "See [Checkbox](wiki-ref://grid-ymtdOF6n4R/i-hES7I02ImG) here"
    );
  });

  it("rewrites multiple Coda links", () => {
    const md =
      "[A](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1) and [B](https://coda.io/d/_d_x#_tugrid-t2/_rui-r2)";
    const result = rewriteLinksToWikiRef(md);
    expect(result).toContain("wiki-ref://grid-t1/i-r1");
    expect(result).toContain("wiki-ref://grid-t2/i-r2");
  });

  it("leaves external URLs untouched", () => {
    const md =
      "[Vanilla](https://vanillaframework.io/docs) and [Coda](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1)";
    const result = rewriteLinksToWikiRef(md);
    expect(result).toContain("https://vanillaframework.io/docs");
    expect(result).toContain("wiki-ref://grid-t1/i-r1");
  });

  it("leaves image links untouched", () => {
    const md =
      "![img](images/abc.png) and [Link](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1)";
    const result = rewriteLinksToWikiRef(md);
    expect(result).toContain("![img](images/abc.png)");
    expect(result).toContain("wiki-ref://grid-t1/i-r1");
  });

  it("returns empty string for empty input", () => {
    expect(rewriteLinksToWikiRef("")).toBe("");
  });

  it("returns unchanged text when no links present", () => {
    const md = "Just some text without any links.";
    expect(rewriteLinksToWikiRef(md)).toBe(md);
  });

  it("returns unchanged text when only non-Coda links present", () => {
    const md = "[Google](https://google.com) and [GitHub](https://github.com)";
    expect(rewriteLinksToWikiRef(md)).toBe(md);
  });

  it("preserves surrounding markdown formatting", () => {
    const md =
      "### Heading\n\nText with **bold** and [Link](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1).\n\n* List item";
    const result = rewriteLinksToWikiRef(md);
    expect(result).toContain("### Heading");
    expect(result).toContain("**bold**");
    expect(result).toContain("wiki-ref://grid-t1/i-r1");
    expect(result).toContain("* List item");
  });
});

// ── rewriteLinksWithApiPairing ──────────────────────────────

describe("rewriteLinksWithApiPairing", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("rewrites HTML-derived links using API link IDs", () => {
    const htmlMd = "Use [Checkbox](https://coda.io/d/old/r8&view=modal) here";
    const apiMd =
      "Use [Checkbox](https://coda.io/d/_d_x#_tugrid-ymtdOF6n4R/_rui-hES7I02ImG) here";
    const result = rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(result).toBe(
      "Use [Checkbox](wiki-ref://grid-ymtdOF6n4R/i-hES7I02ImG) here"
    );
  });

  it("pairs multiple links by matching text", () => {
    const htmlMd =
      "[Checkbox](https://coda.io/d/old/r8) and [Button](https://coda.io/d/old/r5)";
    const apiMd =
      "[Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1) and [Button](https://coda.io/d/_d_x#_tugrid-t2/_rui-r2)";
    const result = rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(result).toContain("wiki-ref://grid-t1/i-r1");
    expect(result).toContain("wiki-ref://grid-t2/i-r2");
  });

  it("leaves external URLs in HTML markdown untouched", () => {
    const htmlMd =
      "[Checkbox](https://coda.io/d/old/r8) and [Google](https://google.com)";
    const apiMd =
      "[Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1) and [Google](https://google.com)";
    const result = rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(result).toContain("wiki-ref://grid-t1/i-r1");
    expect(result).toContain("https://google.com");
  });

  it("handles case-insensitive text matching", () => {
    const htmlMd = "[checkbox](https://coda.io/d/old/r8)";
    const apiMd =
      "[Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1)";
    const result = rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(result).toContain("wiki-ref://grid-t1/i-r1");
  });

  it("warns when API link has no matching HTML link by text", () => {
    const htmlMd = "[Button](https://coda.io/d/old/r5)";
    const apiMd =
      "[Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1)";
    rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no matching HTML link")
    );
  });

  it("warns when all HTML links for a text are consumed", () => {
    const htmlMd = "[Checkbox](https://coda.io/d/old/r8)";
    const apiMd =
      "[Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1) and [Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r2)";
    rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("already consumed")
    );
  });

  it("returns HTML markdown unchanged when no API Coda links exist", () => {
    const htmlMd = "[Link](https://coda.io/d/old/r8)";
    const apiMd = "[Link](https://external.com)";
    const result = rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(result).toBe(htmlMd);
  });

  it("returns HTML markdown unchanged when HTML has no links", () => {
    const htmlMd = "Just plain text";
    const apiMd =
      "[Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1)";
    const result = rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(result).toBe(htmlMd);
  });

  it("returns HTML markdown unchanged when API markdown is empty", () => {
    const htmlMd = "[Link](https://coda.io/d/old/r8)";
    const result = rewriteLinksWithApiPairing(htmlMd, "");
    expect(result).toBe(htmlMd);
  });

  it("returns empty string when HTML markdown is empty", () => {
    const result = rewriteLinksWithApiPairing(
      "",
      "[A](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1)"
    );
    expect(result).toBe("");
  });

  it("handles duplicate link text by consuming in order", () => {
    const htmlMd =
      "First [Checkbox](https://coda.io/d/old/r8) then second [Checkbox](https://coda.io/d/old/r9)";
    const apiMd =
      "First [Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1) then second [Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r2)";
    const result = rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(result).toContain("wiki-ref://grid-t1/i-r1");
    expect(result).toContain("wiki-ref://grid-t1/i-r2");
  });

  it("preserves inline images in HTML markdown", () => {
    const htmlMd =
      "![img](images/abc.png) and [Checkbox](https://coda.io/d/old/r8)";
    const apiMd =
      "and [Checkbox](https://coda.io/d/_d_x#_tugrid-t1/_rui-r1)";
    const result = rewriteLinksWithApiPairing(htmlMd, apiMd);
    expect(result).toContain("![img](images/abc.png)");
    expect(result).toContain("wiki-ref://grid-t1/i-r1");
  });
});
