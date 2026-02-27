import { marked, Renderer } from "marked";

/**
 * Generate a URL-friendly slug from heading text.
 * Strips HTML tags, lowercases, replaces non-alphanumeric chars with hyphens,
 * and trims leading/trailing hyphens.
 */
export function slugify(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, "-") // collapse whitespace/underscores to hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

// Custom renderer that wraps images in <image-lightbox>,
// ensures relative image paths are resolved from the site root,
// and renders headings as anchor links for deep-linking.
const renderer = new Renderer();

renderer.heading = function ({ text, depth, tokens }) {
  // Parse inline tokens to get rendered HTML (bold, italic, code, etc.)
  const innerHTML = this.parser.parseInline(tokens);
  const slug = slugify(text);
  return `<h${depth} id="${slug}"><a href="#${slug}" class="p-link--anchor-heading">${innerHTML}</a></h${depth}>\n`;
};

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
