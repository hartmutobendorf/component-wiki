/**
 * Resolve `wiki-ref://` links in markdown content to final wiki paths.
 *
 * Resolution rules by table:
 * - Construct table → `[Name](/constructs/slug)`
 * - Concepts table → `[Name](/concepts/slug)`
 * - Other tables → link to parent construct/concept section, or plain text
 * - Unknown table or missing row → warning logged, link text preserved
 */

import type { SyncConfig } from "./types.js";

interface ParsedWikiRef {
  tableId: string;
  rowId: string;
}

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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type RawTableData = { rows: Record<string, Record<string, unknown>> };

/**
 * Maps table names to the HTML section anchor on a construct/concept page.
 */
const TABLE_TO_SECTION: Record<string, string> = {
  constructProperties: "properties",
  constructAnatomy: "anatomy",
  documentationChangelog: "changelog",
  documentationDecisionlog: "decisionlog",
};

/**
 * Get the parent construct/concept rowId from a child table row.
 */
function getParentRowId(
  tableName: string,
  row: Record<string, unknown>
): string | null {
  let ref: unknown;

  if (tableName === "documentationChangelog") {
    // Changelog has both construct and concept refs
    ref = row.construct || row.concept;
  } else if (tableName === "documentationDecisionlog") {
    ref = row.construct || row.concept;
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

function resolveWikiRefsInMarkdown(
  markdown: string,
  tableIndex: Map<
    string,
    { tableName: string; rows: Record<string, Record<string, unknown>> }
  >,
  constructTableId: string,
  constructRows: Record<string, Record<string, unknown>>,
  conceptsTableId: string,
  conceptRows: Record<string, Record<string, unknown>>
): string {
  if (!markdown) return markdown;

  const linkRegex = /\[([^\]]*)\]\((wiki-ref:\/\/[^)]+)\)/g;

  return markdown.replace(linkRegex, (fullMatch, text, url) => {
    const parsed = parseWikiRef(url);
    if (!parsed) return fullMatch;

    const tableEntry = tableIndex.get(parsed.tableId);
    if (!tableEntry) {
      console.warn(
        `  ⚠️  wiki-ref: unknown table ID "${parsed.tableId}" in link [${text}]`
      );
      return text;
    }

    const row = tableEntry.rows[parsed.rowId] as Record<string, unknown> | undefined;
    if (!row) {
      console.warn(
        `  ⚠️  wiki-ref: row "${parsed.rowId}" not found in table "${tableEntry.tableName}" for link [${text}]`
      );
      return text;
    }

    // Construct table: link to the construct page
    if (parsed.tableId === constructTableId) {
      const name = (row.name as string) ?? text;
      const slug = generateSlug(name);
      return `[${text}](/${slug})`;
    }

    // Concepts table: link to the concept page
    if (parsed.tableId === conceptsTableId) {
      const name = (row.name as string) ?? text;
      const slug = generateSlug(name);
      return `[${text}](/${slug})`;
    }

    // Non-primary tables: link to section on parent page
    const section = TABLE_TO_SECTION[tableEntry.tableName];
    if (section) {
      const parentRowId = getParentRowId(tableEntry.tableName, row);
      if (parentRowId) {
        // Check construct rows first, then concept rows
        const parentRow = constructRows[parentRowId] ?? conceptRows[parentRowId];
        if (parentRow) {
          const parentSlug = generateSlug((parentRow.name as string) ?? "");
          return `[${text}](/${parentSlug}#${section})`;
        }
      }
      console.warn(
        `  ⚠️  wiki-ref: could not resolve parent for ${tableEntry.tableName} row "${parsed.rowId}" in link [${text}]`
      );
    }

    return text;
  });
}

/**
 * Resolve all wiki-ref:// links across markdown fields.
 * Supports description, usage, examples, interactions, and content.
 */
export function resolveAllWikiRefs(
  fields: { description: string; usage: string; examples: string; interactions?: string; content?: string },
  config: SyncConfig,
  allRawTables: Record<string, RawTableData>
): { description: string; usage: string; examples: string; interactions: string; content?: string } {
  const tableIndex = buildTableIndex(config, allRawTables);
  const constructTableId = config.tables.construct?.id ?? "";
  const constructRows = allRawTables.construct?.rows ?? {};
  const conceptsTableId = config.tables.concepts?.id ?? "";
  const conceptRows = allRawTables.concepts?.rows ?? {};

  const resolve = (md: string) =>
    resolveWikiRefsInMarkdown(md, tableIndex, constructTableId, constructRows, conceptsTableId, conceptRows);

  const result: { description: string; usage: string; examples: string; interactions: string; content?: string } = {
    description: resolve(fields.description),
    usage: resolve(fields.usage),
    examples: resolve(fields.examples),
    interactions: resolve(fields.interactions ?? ""),
  };

  if (fields.content !== undefined) {
    result.content = resolve(fields.content);
  }

  return result;
}

export type { SyncConfig };
