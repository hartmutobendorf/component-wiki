import { marked, Renderer } from "marked";

/**
 * Information about an optimized image, produced by Astro's getImage().
 * Used to substitute raw image paths in markdown with optimized WebP URLs.
 *
 * WHY THIS EXISTS: Markdown in this project lives inside JSON content
 * collection fields (description, usage, examples, etc.), not in .md files.
 * This means it bypasses Astro's built-in markdown rendering pipeline and
 * its automatic image optimization. The image map bridges that gap —
 * ConstructPage/ConceptPage call getImage() in their frontmatter to build
 * this map, then pass it here so the renderer can emit optimized URLs
 * with proper width/height attributes (preventing CLS).
 */
export interface OptimizedImageInfo {
  /** Optimized URL (WebP, hashed, etc.) */
  src: string;
  /** Intrinsic width — prevents Cumulative Layout Shift */
  width: number;
  /** Intrinsic height — prevents Cumulative Layout Shift */
  height: number;
}

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

/**
 * Create a marked Renderer that optionally substitutes image paths with
 * optimized URLs from the provided image map.
 */
function createRenderer(
  imageMap?: Map<string, OptimizedImageInfo>,
): Renderer {
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
    let src =
      href && !href.startsWith("/") && !href.startsWith("http")
        ? `/${href}`
        : href;

    // Substitute with optimized URL if available in the image map.
    // The map is keyed by the original path as it appears in the JSON data
    // (e.g. "images/abc.png"). See OptimizedImageInfo docblock for context.
    let dimensionAttrs = "";
    if (imageMap && href) {
      // Try both with and without leading slash
      const lookupKey = href.startsWith("/") ? href.slice(1) : href;
      const info = imageMap.get(lookupKey);
      if (info) {
        src = info.src;
        dimensionAttrs = ` width="${info.width}" height="${info.height}"`;
      }
    }

    return `<image-lightbox><img src="${src}" alt="${text}"${titleAttr}${dimensionAttrs} loading="lazy" decoding="async" /></image-lightbox>`;
  };

  return renderer;
}

// Default renderer for calls without an image map (e.g. unit tests)
const defaultRenderer = createRenderer();

// Configure marked defaults
marked.use({
  gfm: true,
  breaks: false,
  renderer: defaultRenderer,
});

export function renderMarkdown(
  content: string,
  imageMap?: Map<string, OptimizedImageInfo>,
): string {
  if (!content || !content.trim()) return "";
  if (imageMap) {
    // Use a renderer with the image map for this parse only
    const renderer = createRenderer(imageMap);
    return marked.parse(content, { renderer }) as string;
  }
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
