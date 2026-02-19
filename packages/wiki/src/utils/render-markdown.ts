import { marked, Renderer } from "marked";

// Custom renderer that wraps images in <image-lightbox>
// and ensures relative image paths are resolved from the site root
const renderer = new Renderer();
renderer.image = function ({ href, title, text }) {
  const titleAttr = title ? ` title="${title}"` : "";
  // Ensure relative paths like "images/..." become absolute "/images/..."
  const src =
    href && !href.startsWith("/") && !href.startsWith("http")
      ? `/${href}`
      : href;
  return `<image-lightbox><img src="${src}" alt="${text}"${titleAttr} /></image-lightbox>`;
};

// Configure marked for GFM (tables, strikethrough, etc.)
marked.use({
  gfm: true,
  breaks: false,
  renderer,
});

export function renderMarkdown(content: string): string {
  if (!content || !content.trim()) return "";
  return marked.parse(content) as string;
}

/**
 * Render inline markdown only (no block-level elements like <p>, <h1>, etc.).
 * Useful for table cells and other inline contexts.
 */
export function renderInlineMarkdown(content: string): string {
  if (!content || !content.trim()) return "";
  return marked.parseInline(content) as string;
}
