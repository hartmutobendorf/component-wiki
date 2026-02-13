import { describe, it, expect } from "vitest";
import { htmlToMarkdown, replaceImagePlaceholders } from "../../src/html/turndown";

describe("htmlToMarkdown", () => {
  it("returns empty markdown for empty input", () => {
    const result = htmlToMarkdown("");
    expect(result.markdown).toBe("");
    expect(result.imageUrls).toEqual([]);
  });

  it("returns empty markdown for whitespace-only input", () => {
    const result = htmlToMarkdown("   \n  ");
    expect(result.markdown).toBe("");
    expect(result.imageUrls).toEqual([]);
  });

  it("converts simple paragraph", () => {
    const result = htmlToMarkdown("<p>Hello world</p>");
    expect(result.markdown).toBe("Hello world");
  });

  it("converts bold spans (with space)", () => {
    const result = htmlToMarkdown(
      '<span style="font-weight: bold;">Bold text</span>'
    );
    expect(result.markdown).toContain("**Bold text**");
  });

  it("converts bold spans (without space)", () => {
    const result = htmlToMarkdown(
      '<span style="font-weight:bold;">Bold text</span>'
    );
    expect(result.markdown).toContain("**Bold text**");
  });

  it("converts italic spans (with space)", () => {
    const result = htmlToMarkdown(
      '<span style="font-style: italic;">Italic text</span>'
    );
    expect(result.markdown).toContain("_Italic text_");
  });

  it("converts italic spans (without space)", () => {
    const result = htmlToMarkdown(
      '<span style="font-style:italic;">Italic text</span>'
    );
    expect(result.markdown).toContain("_Italic text_");
  });

  it("passes through spans with unrecognized styles", () => {
    const result = htmlToMarkdown(
      '<span style="color: red;">Red text</span>'
    );
    expect(result.markdown).toContain("Red text");
    expect(result.markdown).not.toContain("**");
    expect(result.markdown).not.toContain("_");
  });

  it("tracks image URLs and inserts placeholders", () => {
    const result = htmlToMarkdown(
      '<p>Before</p><img src="https://cdn.example.com/pic.png" alt="My pic"><p>After</p>'
    );
    expect(result.imageUrls).toEqual(["https://cdn.example.com/pic.png"]);
    expect(result.markdown).toContain("![My pic](IMAGE_PLACEHOLDER_0)");
  });

  it("tracks multiple images with correct indices", () => {
    const result = htmlToMarkdown(
      '<img src="https://a.com/1.png" alt="one"><img src="https://b.com/2.jpg" alt="two">'
    );
    expect(result.imageUrls).toHaveLength(2);
    expect(result.markdown).toContain("IMAGE_PLACEHOLDER_0");
    expect(result.markdown).toContain("IMAGE_PLACEHOLDER_1");
  });

  it("uses 'image' as default alt text", () => {
    const result = htmlToMarkdown('<img src="https://a.com/1.png">');
    expect(result.markdown).toContain("![image]");
  });

  it("converts code blocks", () => {
    const result = htmlToMarkdown(
      "<pre><code>&lt;Button /&gt;</code></pre>"
    );
    expect(result.markdown).toContain("<Button />");
  });

  it("converts headings", () => {
    const result = htmlToMarkdown("<h2>Section Title</h2>");
    expect(result.markdown).toContain("## Section Title");
  });

  it("handles mixed content with bold, italic, images, and text", () => {
    const html = `
      <p>Use the <span style="font-weight: bold;">Button</span> for 
      <span style="font-style: italic;">primary actions</span>.</p>
      <img src="https://cdn.example.com/btn.png" alt="Button">
    `;
    const result = htmlToMarkdown(html);
    expect(result.markdown).toContain("**Button**");
    expect(result.markdown).toContain("_primary actions_");
    expect(result.imageUrls).toEqual(["https://cdn.example.com/btn.png"]);
  });
});

describe("replaceImagePlaceholders", () => {
  it("replaces placeholders with local paths", () => {
    const markdown = "![pic](IMAGE_PLACEHOLDER_0) and ![pic2](IMAGE_PLACEHOLDER_1)";
    const urlToPath = new Map([
      ["https://a.com/1.png", "images/abc.png"],
      ["https://b.com/2.jpg", "images/def.jpg"],
    ]);
    const imageUrls = ["https://a.com/1.png", "https://b.com/2.jpg"];

    const result = replaceImagePlaceholders(markdown, urlToPath, imageUrls);
    expect(result).toContain("images/abc.png");
    expect(result).toContain("images/def.jpg");
    expect(result).not.toContain("IMAGE_PLACEHOLDER");
  });

  it("removes broken image references when URL not in map", () => {
    const markdown = "Before ![broken](IMAGE_PLACEHOLDER_0) After";
    const urlToPath = new Map<string, string>();
    const imageUrls = ["https://missing.com/x.png"];

    const result = replaceImagePlaceholders(markdown, urlToPath, imageUrls);
    expect(result).not.toContain("IMAGE_PLACEHOLDER");
    expect(result).not.toContain("![broken]");
    expect(result).toContain("Before");
    expect(result).toContain("After");
  });

  it("handles empty imageUrls array", () => {
    const markdown = "No images here";
    const result = replaceImagePlaceholders(markdown, new Map(), []);
    expect(result).toBe("No images here");
  });

  it("trims the result", () => {
    const markdown = "  content  ";
    const result = replaceImagePlaceholders(markdown, new Map(), []);
    expect(result).toBe("content");
  });
});
