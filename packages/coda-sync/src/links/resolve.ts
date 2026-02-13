/**
 * Internal Link Resolution — rewrites Coda-internal URLs to source-agnostic
 * `wiki-ref://` references in raw data.
 *
 * ## Why this exists
 *
 * Content authored in Coda can contain links to other rows (e.g., Accordion's
 * usage text links to Checkbox). These links must be converted from Coda-internal
 * URLs to a source-agnostic format so downstream packages (transform, wiki) don't
 * need to know anything about Coda.
 *
 * ## Two data sources for the same content
 *
 * We fetch content from Coda via two paths:
 *
 * 1. **API with `valueFormat: "rich"`** — Returns markdown with links containing
 *    stable table and row IDs encoded in the URL:
 *    ```
 *    [Checkbox](https://coda.io/d/_d_MEO4xiNKu#_tugrid-ymtdOF6n4R/_rui-hES7I02ImG)
 *    ```
 *    However, the API **drops inline images** from text content fields.
 *
 * 2. **HTML page export** — Preserves inline images in content, but links use
 *    fragile positional references without row IDs:
 *    ```html
 *    <a href="https://coda.io/d/_d_MEO4xiNKu#UI-Blocks_tuOF6n4R/r8&view=modal">Checkbox</a>
 *    ```
 *
 * ## The resolution process
 *
 * For **API-only columns** (e.g., Description): straightforward — parse table/row
 * IDs from the Coda URL and rewrite to `wiki-ref://tableId/rowId`.
 *
 * For **htmlColumns** (e.g., Usage, Examples): the HTML-derived markdown has the
 * inline images we need, but its links lack row IDs. We pair links from the API
 * version (which has row IDs) with links from the HTML version (which has images)
 * by position, verifying link text matches as a safety check.
 *
 * ## The `wiki-ref://` scheme
 *
 * Output format: `[Checkbox](wiki-ref://grid-ymtdOF6n4R/i-hES7I02ImG)`
 *
 * This is valid markdown, human-readable, source-agnostic, and encodes enough
 * information (table ID + row ID) for the transform step to make routing decisions
 * (e.g., component links → `/slug`, property links → `/slug#properties`).
 */

/** A markdown link extracted from text. */
export interface ExtractedLink {
  /** The link text (e.g., "Checkbox") */
  text: string;
  /** The link URL */
  url: string;
  /** Start index of the full markdown link in the source text */
  startIndex: number;
  /** End index (exclusive) of the full markdown link in the source text */
  endIndex: number;
  /** Positional index (0-based) among all links in the source */
  position: number;
}

/** Parsed Coda URL components. */
export interface ParsedCodaUrl {
  tableId: string;
  rowId: string;
}

/**
 * Extract all markdown links from a string.
 *
 * Finds `[text](url)` patterns, skipping image links `![alt](src)`.
 * Returns links in order of appearance with their positions.
 */
export function extractMarkdownLinks(markdown: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  // Match [text](url) but not ![alt](src)
  const linkRegex = /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  let position = 0;

  while ((match = linkRegex.exec(markdown)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      position: position++,
    });
  }

  return links;
}

/**
 * Parse a Coda-internal URL to extract table ID and row ID.
 *
 * Coda API rich format URLs look like:
 *   https://coda.io/d/_d_MEO4xiNKu#_tugrid-ymtdOF6n4R/_rui-hES7I02ImG
 *
 * Where:
 *   - `_tu` prefix marks the table segment, followed by the table ID (e.g., `grid-ymtdOF6n4R`)
 *   - `_rui-` prefix marks the row segment, followed by the row ID (e.g., `i-hES7I02ImG`)
 *
 * Returns null for non-Coda URLs or URLs that don't match the expected pattern.
 */
export function parseCodaUrl(url: string): ParsedCodaUrl | null {
  if (!url.includes("coda.io")) {
    return null;
  }

  try {
    // The table and row IDs are in the URL fragment (after #)
    // Pattern: #..._tu{tableId}/_rui-{rowId}
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) return null;

    const fragment = url.substring(hashIndex + 1);

    // Extract table ID: _tu followed by the table ID (e.g., grid-ymtdOF6n4R)
    const tableMatch = fragment.match(/_tu(grid-[a-zA-Z0-9_-]+)/);
    if (!tableMatch) return null;

    // Extract row ID: _ru followed by the row ID (e.g., i-hES7I02ImG)
    // The `_ru` prefix is immediately followed by the row ID which starts with `i-`
    const rowMatch = fragment.match(/_ru(i-[a-zA-Z0-9_-]+)/);
    if (!rowMatch) return null;

    return {
      tableId: tableMatch[1],
      rowId: rowMatch[1],
    };
  } catch {
    return null;
  }
}

/**
 * Rewrite Coda-internal links to `wiki-ref://` format in markdown text.
 *
 * Used for **API-only columns** (e.g., Description) where the markdown comes
 * directly from the Coda API with rich format. Links already contain stable
 * table and row IDs — we just rewrite the URL scheme.
 *
 * External URLs (https://example.com, etc.) are left untouched.
 *
 * @param markdown - Markdown text from the Coda API
 * @returns Markdown with Coda URLs rewritten to wiki-ref:// format
 */
export function rewriteLinksToWikiRef(markdown: string): string {
  if (!markdown) return markdown;

  const links = extractMarkdownLinks(markdown);
  if (links.length === 0) return markdown;

  // Process links in reverse order so indices stay valid
  let result = markdown;
  for (let i = links.length - 1; i >= 0; i--) {
    const link = links[i];
    const parsed = parseCodaUrl(link.url);
    if (!parsed) continue; // Skip non-Coda URLs

    const wikiRef = `wiki-ref://${parsed.tableId}/${parsed.rowId}`;
    const newLink = `[${link.text}](${wikiRef})`;
    result =
      result.substring(0, link.startIndex) +
      newLink +
      result.substring(link.endIndex);
  }

  return result;
}

/**
 * Rewrite links in HTML-derived markdown using the API version as a reference
 * for table and row IDs.
 *
 * Used for **htmlColumns** (e.g., Usage, Examples) where:
 * - The HTML-derived markdown has inline images we need to preserve
 * - But its links lack row IDs (HTML export uses fragile positional references)
 * - The API version of the same field has proper Coda URLs with table/row IDs
 *
 * ## Pairing process
 *
 * 1. Extract all non-image links from both the API markdown and HTML-derived markdown
 * 2. Filter API links to only those that are Coda-internal URLs (have table/row IDs)
 * 3. For each API link with a Coda URL, find the matching link in the HTML-derived
 *    markdown by matching on link text (case-insensitive, trimmed)
 * 4. Verify the link text matches as a safety check
 * 5. Rewrite the HTML link's URL to `wiki-ref://tableId/rowId`
 *
 * If link text doesn't match for a pair, a warning is logged and that link is skipped.
 * External URLs in the HTML markdown are left untouched.
 *
 * @param htmlMarkdown - Markdown converted from HTML export (has inline images)
 * @param apiMarkdown - Markdown from the API rich format (has stable Coda URLs)
 * @returns HTML-derived markdown with Coda links rewritten to wiki-ref:// format
 */
export function rewriteLinksWithApiPairing(
  htmlMarkdown: string,
  apiMarkdown: string
): string {
  if (!htmlMarkdown || !apiMarkdown) return htmlMarkdown;

  const htmlLinks = extractMarkdownLinks(htmlMarkdown);
  const apiLinks = extractMarkdownLinks(apiMarkdown);

  if (htmlLinks.length === 0 || apiLinks.length === 0) return htmlMarkdown;

  // Filter API links to only Coda-internal URLs with parsed table/row IDs
  const codaApiLinks = apiLinks
    .map((link) => ({ link, parsed: parseCodaUrl(link.url) }))
    .filter(
      (entry): entry is { link: ExtractedLink; parsed: ParsedCodaUrl } =>
        entry.parsed !== null
    );

  if (codaApiLinks.length === 0) return htmlMarkdown;

  // Build a lookup of HTML links by normalized text for matching
  // Group by text to handle multiple links with the same text
  const htmlLinksByText = new Map<string, ExtractedLink[]>();
  for (const link of htmlLinks) {
    const key = link.text.trim().toLowerCase();
    const existing = htmlLinksByText.get(key) ?? [];
    existing.push(link);
    htmlLinksByText.set(key, existing);
  }

  // Track which HTML links have been consumed (for handling duplicates)
  const consumedHtmlIndices = new Set<number>();

  // Collect rewrites: { htmlLink, wikiRefUrl }
  const rewrites: Array<{ htmlLink: ExtractedLink; wikiRefUrl: string }> = [];

  for (const { link: apiLink, parsed } of codaApiLinks) {
    const apiText = apiLink.text.trim().toLowerCase();
    const candidates = htmlLinksByText.get(apiText);

    if (!candidates || candidates.length === 0) {
      console.warn(
        `  ⚠️  Link pairing: API link [${apiLink.text}] has no matching HTML link by text`
      );
      continue;
    }

    // Find the first unconsumed candidate
    const htmlLink = candidates.find(
      (c) => !consumedHtmlIndices.has(c.position)
    );
    if (!htmlLink) {
      console.warn(
        `  ⚠️  Link pairing: all HTML links for text "${apiLink.text}" already consumed`
      );
      continue;
    }

    consumedHtmlIndices.add(htmlLink.position);
    const wikiRefUrl = `wiki-ref://${parsed.tableId}/${parsed.rowId}`;
    rewrites.push({ htmlLink, wikiRefUrl });
  }

  if (rewrites.length === 0) return htmlMarkdown;

  // Apply rewrites in reverse order of position to preserve indices
  rewrites.sort((a, b) => b.htmlLink.startIndex - a.htmlLink.startIndex);

  let result = htmlMarkdown;
  for (const { htmlLink, wikiRefUrl } of rewrites) {
    const newLink = `[${htmlLink.text}](${wikiRefUrl})`;
    result =
      result.substring(0, htmlLink.startIndex) +
      newLink +
      result.substring(htmlLink.endIndex);
  }

  return result;
}
