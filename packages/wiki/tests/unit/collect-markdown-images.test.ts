import { describe, it, expect } from "vitest";
import { collectMarkdownImages } from "../../src/utils/collect-markdown-images";

describe("collectMarkdownImages", () => {
  it("extracts image paths from markdown", () => {
    const md = "Some text ![alt](images/abc.png) more text";
    expect(collectMarkdownImages(md)).toEqual(["images/abc.png"]);
  });

  it("extracts multiple images", () => {
    const md =
      "![one](images/a.png) text ![two](images/b.png) ![three](images/c.png)";
    expect(collectMarkdownImages(md)).toEqual([
      "images/a.png",
      "images/b.png",
      "images/c.png",
    ]);
  });

  it("deduplicates paths", () => {
    const md = "![a](images/same.png) ![b](images/same.png)";
    expect(collectMarkdownImages(md)).toEqual(["images/same.png"]);
  });

  it("deduplicates across multiple strings", () => {
    const result = collectMarkdownImages(
      "![a](images/shared.png)",
      "![b](images/shared.png)",
      "![c](images/unique.png)",
    );
    expect(result).toEqual(["images/shared.png", "images/unique.png"]);
  });

  it("ignores external URLs", () => {
    const md =
      "![ext](https://example.com/img.png) ![local](images/local.png)";
    expect(collectMarkdownImages(md)).toEqual(["images/local.png"]);
  });

  it("ignores http URLs", () => {
    const md = "![ext](http://example.com/img.png)";
    expect(collectMarkdownImages(md)).toEqual([]);
  });

  it("returns empty array for no images", () => {
    expect(collectMarkdownImages("No images here")).toEqual([]);
  });

  it("handles empty and null-ish strings", () => {
    expect(collectMarkdownImages("", "", "")).toEqual([]);
  });

  it("handles mixed content", () => {
    const md = `
# Heading
Some text with ![screenshot](images/shot.png)
A [link](https://example.com) and ![diagram](images/diagram.png)
More text
    `;
    expect(collectMarkdownImages(md)).toEqual([
      "images/shot.png",
      "images/diagram.png",
    ]);
  });

  it("trims whitespace from paths", () => {
    const md = "![alt]( images/spaced.png )";
    expect(collectMarkdownImages(md)).toEqual(["images/spaced.png"]);
  });
});
