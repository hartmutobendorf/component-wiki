/**
 * Resolve `wiki-ref://` links in markdown content to final wiki paths.
 *
 * The coda-sync package rewrites Coda-internal URLs to a source-agnostic
 * `wiki-ref://tableId/rowId` format. This module resolves those references
 * to actual wiki paths using the raw table data and config.
 *
 * Resolution rules by table:
 * - Components table → `[Name](/slug)` (generate slug from component name)
 * - Other tables → link text is preserved, URL is removed (rendered as plain text)
 * - Unknown table or missing row → warning logged, link text preserved without URL
 */

import type { SyncConfig } from "./types.js";

/** Parsed wiki-ref link components. */
interface ParsedWikiRef {
  tableId: string;
  rowId: string;
}

/**
 * Parse a `wiki-ref://tableId/rowId` URL.
 * Returns null if the URL doesn't match the expected format.
 */
function parseWikiRef(url: string): ParsedWikiRef | null {
  if (!url.startsWith("wiki-ref://")) return null;

  const path = url.substring("wiki-ref://".length);
  const slashIndex = path.indexOf("/");
  if (slashIndex === -1) return null;

  return {
    tableId: path.substring(0, slashIndex),
    rowId: path.substring(slashIndex + 1),
  };
}

/**
 * Generate a URL slug from a component name.
 * "Accordion" → "accordion", "CTA block" → "cta-block"
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** A raw table with rows keyed by rowId. Rows may or may not have a name field. */
type RawTableData = { rows: Record<string, Record<string, unknown>> };

/**
 * Maps table names to the HTML section anchor on a component page.
 * Used when resolving non-component wiki-ref links — we link to the
 * relevant section on the parent component's page.
 */
const TABLE_TO_SECTION: Record<string, string> = {
  properties: "properties",
  anatomy: "anatomy",
  changelog: "changelog",
  decisionLog: "decisionlog",
};

/**
 * Get the parent component rowId from a non-component row.
 *
 * Different tables store the parent reference in different fields:
 * - properties.component → array of component rowIds (take first)
 * - anatomy.component → single component rowId
 * - changelog.name → component rowId
 * - decisionLog.component → single component rowId
 */
function getParentComponentRowId(
  tableName: string,
  row: Record<string, unknown>
): string | null {
  let ref: unknown;

  if (tableName === "changelog") {
    // Changelog stores the component ref in the "name" field
    ref = row.name;
  } else {
    ref = row.component;
  }

  if (Array.isArray(ref)) {
    return (ref[0] as string) ?? null;
  }
  if (typeof ref === "string" && ref.trim()) {
    return ref;
  }
  return null;
}

/**
 * Build a mapping from table ID → { tableName, rows } for quick lookup.
 */
function buildTableIndex(
  config: SyncConfig,
  allRawTables: Record<string, RawTableData>
): Map<string, { tableName: string; rows: Record<string, Record<string, unknown>> }> {
  const index = new Map<
    string,
    { tableName: string; rows: Record<string, Record<string, unknown>> }
  >();

  for (const [tableName, tableConfig] of Object.entries(config.tables)) {
    const rawTable = allRawTables[tableName];
    if (rawTable) {
      index.set(tableConfig.id, { tableName, rows: rawTable.rows });
    }
  }

  return index;
}

/**
 * Resolve all `wiki-ref://` links in a markdown string to final wiki paths.
 *
 * @param markdown - Markdown text potentially containing wiki-ref:// links
 * @param tableIndex - Mapping from table ID to table data (built by buildTableIndex)
 * @param componentsTableId - The table ID for the components table
 * @returns Markdown with wiki-ref:// links resolved to wiki paths
 */
function resolveWikiRefsInMarkdown(
  markdown: string,
  tableIndex: Map<
    string,
    { tableName: string; rows: Record<string, Record<string, unknown>> }
  >,
  componentsTableId: string,
  componentRows: Record<string, Record<string, unknown>>
): string {
  if (!markdown) return markdown;

  // Match [text](wiki-ref://...) links
  const linkRegex = /\[([^\]]*)\]\((wiki-ref:\/\/[^)]+)\)/g;

  return markdown.replace(linkRegex, (fullMatch, text, url) => {
    const parsed = parseWikiRef(url);
    if (!parsed) return fullMatch;

    const tableEntry = tableIndex.get(parsed.tableId);
    if (!tableEntry) {
      console.warn(
        `  ⚠️  wiki-ref: unknown table ID "${parsed.tableId}" in link [${text}]`
      );
      return text; // Strip the link, keep the text
    }

    const row = tableEntry.rows[parsed.rowId] as Record<string, unknown> | undefined;
    if (!row) {
      console.warn(
        `  ⚠️  wiki-ref: row "${parsed.rowId}" not found in table "${tableEntry.tableName}" for link [${text}]`
      );
      return text; // Strip the link, keep the text
    }

    // Components table: link to the component page
    if (parsed.tableId === componentsTableId) {
      const name = (row.name as string) ?? text;
      const slug = generateSlug(name);
      return `[${text}](/${slug})`;
    }

    // Non-component tables (properties, anatomy, changelog, decisionLog):
    // Link to the relevant section on the parent component's page.
    // e.g., a property "Size" on Button → [Size](/button#properties)
    const section = TABLE_TO_SECTION[tableEntry.tableName];
    if (section) {
      const parentRowId = getParentComponentRowId(tableEntry.tableName, row);
      if (parentRowId) {
        const parentRow = componentRows[parentRowId];
        if (parentRow) {
          const parentSlug = generateSlug((parentRow.name as string) ?? "");
          return `[${text}](/${parentSlug}#${section})`;
        }
      }
      // Couldn't resolve parent component — fall through to plain text
      console.warn(
        `  ⚠️  wiki-ref: could not resolve parent component for ${tableEntry.tableName} row "${parsed.rowId}" in link [${text}]`
      );
    }

    // Unknown table type with no section mapping — render as plain text
    return text;
  });
}

/**
 * Resolve all wiki-ref:// links across all markdown fields of a component.
 *
 * Call this during denormalization for each component's description, usage,
 * and examples fields.
 */
export function resolveAllWikiRefs(
  fields: { description: string; usage: string; examples: string; interactions: string },
  config: SyncConfig,
  allRawTables: Record<string, RawTableData>
): { description: string; usage: string; examples: string; interactions: string } {
  const tableIndex = buildTableIndex(config, allRawTables);
  const componentsTableId = config.tables.components?.id ?? "";
  const componentRows = allRawTables.components?.rows ?? {};

  return {
    description: resolveWikiRefsInMarkdown(
      fields.description,
      tableIndex,
      componentsTableId,
      componentRows
    ),
    usage: resolveWikiRefsInMarkdown(
      fields.usage,
      tableIndex,
      componentsTableId,
      componentRows
    ),
    examples: resolveWikiRefsInMarkdown(
      fields.examples,
      tableIndex,
      componentsTableId,
      componentRows
    ),
    interactions: resolveWikiRefsInMarkdown(
      fields.interactions,
      tableIndex,
      componentsTableId,
      componentRows
    ),
  };
}

/** Minimal sync config shape needed for link resolution. */
export type { SyncConfig };
