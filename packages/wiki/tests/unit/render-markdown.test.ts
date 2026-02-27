import { describe, it, expect } from "vitest";
import { renderMarkdown, slugify } from "../../src/utils/render-markdown.js";

// ── Basic rendering ─────────────────────────────────────────

describe("renderMarkdown — basic rendering", () => {
  it("renders a paragraph from plain text", () => {
    const result = renderMarkdown("Hello world");
    expect(result).toContain("<p>Hello world</p>");
  });

  it("renders headings as anchor links with ids", () => {
    const result = renderMarkdown("# Title\n\n## Subtitle");
    expect(result).toContain('<h1 id="title"><a href="#title" class="p-link--anchor-heading">Title</a></h1>');
    expect(result).toContain('<h2 id="subtitle"><a href="#subtitle" class="p-link--anchor-heading">Subtitle</a></h2>');
  });

  it("renders bold text", () => {
    const result = renderMarkdown("**bold**");
    expect(result).toContain("<strong>bold</strong>");
  });

  it("renders italic text", () => {
    const result = renderMarkdown("*italic*");
    expect(result).toContain("<em>italic</em>");
  });

  it("renders links", () => {
    const result = renderMarkdown("[click](https://example.com)");
    expect(result).toContain('<a href="https://example.com">click</a>');
  });

  it("renders unordered lists", () => {
    const result = renderMarkdown("- item 1\n- item 2");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>item 1</li>");
    expect(result).toContain("<li>item 2</li>");
  });

  it("renders ordered lists", () => {
    const result = renderMarkdown("1. first\n2. second");
    expect(result).toContain("<ol>");
    expect(result).toContain("<li>first</li>");
    expect(result).toContain("<li>second</li>");
  });

  it("renders inline code", () => {
    const result = renderMarkdown("`code`");
    expect(result).toContain("<code>code</code>");
  });

  it("renders code blocks", () => {
    const result = renderMarkdown("```\nconst x = 1;\n```");
    expect(result).toContain("<code>");
    expect(result).toContain("const x = 1;");
  });

  it("renders blockquotes", () => {
    const result = renderMarkdown("> quoted text");
    expect(result).toContain("<blockquote>");
    expect(result).toContain("quoted text");
  });
});

// ── GFM features ────────────────────────────────────────────

describe("renderMarkdown — GFM features", () => {
  it("renders tables", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const result = renderMarkdown(md);
    expect(result).toContain("<table>");
    expect(result).toContain("<th>A</th>");
    expect(result).toContain("<td>1</td>");
  });

  it("renders strikethrough", () => {
    const result = renderMarkdown("~~deleted~~");
    expect(result).toContain("<del>deleted</del>");
  });
});

// ── Image lightbox wrapping ─────────────────────────────────

describe("renderMarkdown — image lightbox", () => {
  it("wraps images in <image-lightbox> tags", () => {
    const result = renderMarkdown("![alt text](image.png)");
    expect(result).toContain("<image-lightbox>");
    expect(result).toContain("</image-lightbox>");
    expect(result).toContain('<img src="/image.png" alt="alt text"');
  });

  it("includes title attribute when provided", () => {
    const result = renderMarkdown('![alt](image.png "My Title")');
    expect(result).toContain('title="My Title"');
    expect(result).toContain("<image-lightbox>");
  });

  it("renders image without title attribute when not provided", () => {
    const result = renderMarkdown("![alt](image.png)");
    expect(result).not.toContain("title=");
  });

  it("wraps multiple images independently", () => {
    const md = "![a](one.png)\n\n![b](two.png)";
    const result = renderMarkdown(md);
    const matches = result.match(/<image-lightbox>/g);
    expect(matches).toHaveLength(2);
  });
});

// ── Slugify ─────────────────────────────────────────────────

describe("slugify", () => {
  it("lowercases and hyphenates text", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips HTML tags", () => {
    expect(slugify("Hello <code>World</code>")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("What's this?")).toBe("whats-this");
  });

  it("collapses multiple spaces and hyphens", () => {
    expect(slugify("Too   many   spaces")).toBe("too-many-spaces");
    expect(slugify("too---many---hyphens")).toBe("too-many-hyphens");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --hello--  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

// ── Heading anchor links ────────────────────────────────────

describe("renderMarkdown — heading anchor links", () => {
  it("adds id attribute to headings", () => {
    const result = renderMarkdown("## My Section");
    expect(result).toContain('id="my-section"');
  });

  it("wraps heading text in anchor link with correct class", () => {
    const result = renderMarkdown("## My Section");
    expect(result).toContain('class="p-link--anchor-heading"');
    expect(result).toContain('href="#my-section"');
  });

  it("renders all heading levels with anchors", () => {
    const md = "# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6";
    const result = renderMarkdown(md);
    for (let i = 1; i <= 6; i++) {
      expect(result).toContain(`<h${i} id=`);
      expect(result).toContain(`</a></h${i}>`);
    }
  });

  it("handles headings with inline formatting", () => {
    const result = renderMarkdown("## **Bold** heading");
    expect(result).toContain('id="bold-heading"');
    expect(result).toContain("<strong>Bold</strong> heading</a>");
  });
});

// ── Empty / whitespace input ────────────────────────────────

describe("renderMarkdown — empty input", () => {
  it("returns empty string for empty input", () => {
    expect(renderMarkdown("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(renderMarkdown("   ")).toBe("");
  });

  it("returns empty string for newline-only input", () => {
    expect(renderMarkdown("\n\n\n")).toBe("");
  });

  it("returns empty string for null-like input", () => {
    expect(renderMarkdown(null as unknown as string)).toBe("");
    expect(renderMarkdown(undefined as unknown as string)).toBe("");
  });
});

// ── Complex content ─────────────────────────────────────────

describe("renderMarkdown — complex content", () => {
  it("renders mixed content correctly", () => {
    const md = `# Title

Some **bold** and *italic* text.

- Item 1
- Item 2

![example](img.png)`;

    const result = renderMarkdown(md);
    expect(result).toContain('<h1 id="title">');
    expect(result).toContain("Title</a></h1>");
    expect(result).toContain("<strong>bold</strong>");
    expect(result).toContain("<em>italic</em>");
    expect(result).toContain("<ul>");
    expect(result).toContain("<image-lightbox>");
  });

  it("does not insert hard breaks for single newlines (breaks: false)", () => {
    const result = renderMarkdown("line one\nline two");
    expect(result).not.toContain("<br");
  });
});
