/**
 * Scan markdown strings for image references and return a deduplicated
 * list of local image paths.
 *
 * Used by ConstructPage/ConceptPage to pre-build an optimized image map
 * via Astro's getImage() before passing markdown to the renderer.
 */

const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)]+)\)/g;

/**
 * Extract all local image paths from one or more markdown strings.
 * Ignores external URLs (http/https). Returns deduplicated paths.
 */
export function collectMarkdownImages(...markdownStrings: string[]): string[] {
  const paths = new Set<string>();

  for (const md of markdownStrings) {
    if (!md) continue;
    let match: RegExpExecArray | null;
    MARKDOWN_IMAGE_RE.lastIndex = 0;

    while ((match = MARKDOWN_IMAGE_RE.exec(md)) !== null) {
      const href = match[1].trim();
      // Skip external URLs
      if (href.startsWith("http://") || href.startsWith("https://")) continue;
      paths.add(href);
    }
  }

  return [...paths];
}
