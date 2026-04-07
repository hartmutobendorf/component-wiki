/**
 * Resolve `wiki-ref://` links in markdown content to final wiki paths.
 *
 * Resolution rules by table:
 * - Construct table → `[Name](/{tierPrefix}/{slug})`
 * - Concepts table → `[Name](/{tierPrefix}/concept/{slug})`
 * - Other tables → link to parent construct/concept section, or plain text
 * - Unknown table or missing row → warning logged, link text preserved
 *
 * Path construction is delegated to `@wiki/shared` so every package
 * produces identical URLs.
 */

import { buildPath } from "@wiki/shared";
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

/**
 * Build a map from tier row ID → tier name (e.g. "Global", "Apps", "Sites").
 */
function buildTierLookup(
  tierRows: Record<string, Record<string, unknown>>
): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [rowId, row] of Object.entries(tierRows)) {
    const name = (row.name as string) ?? "";
    if (name) {
      lookup.set(rowId, name);
    }
  }
  return lookup;
}

/**
 * Resolve the tier name from a raw row by looking up its `tier` reference ID
 * in the documentationTiers table.
 */
function resolveTier(
  row: Record<string, unknown>,
  tierLookup: Map<string, string>
): string {
  const tierId = row.tier as string | undefined;
  return tierId ? (tierLookup.get(tierId) ?? "") : "";
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
  conceptRows: Record<string, Record<string, unknown>>,
  tierLookup: Map<string, string>
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
      const tier = resolveTier(row, tierLookup);
      return `[${text}](/${buildPath(tier, "construct", slug)})`;
    }

    // Concepts table: link to the concept page
    if (parsed.tableId === conceptsTableId) {
      const name = (row.name as string) ?? text;
      const slug = generateSlug(name);
      const tier = resolveTier(row, tierLookup);
      return `[${text}](/${buildPath(tier, "concept", slug)})`;
    }

    // Non-primary tables: link to section on parent page
    const section = TABLE_TO_SECTION[tableEntry.tableName];
    if (section) {
      const parentRowId = getParentRowId(tableEntry.tableName, row);
      if (parentRowId) {
        const parentConstructRow = constructRows[parentRowId];
        if (parentConstructRow) {
          const parentSlug = generateSlug((parentConstructRow.name as string) ?? "");
          const tier = resolveTier(parentConstructRow, tierLookup);
          return `[${text}](/${buildPath(tier, "construct", parentSlug)}#${section})`;
        }
        const parentConceptRow = conceptRows[parentRowId];
        if (parentConceptRow) {
          const parentSlug = generateSlug((parentConceptRow.name as string) ?? "");
          const tier = resolveTier(parentConceptRow, tierLookup);
          return `[${text}](/${buildPath(tier, "concept", parentSlug)}#${section})`;
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
  const tierRows = allRawTables.documentationTiers?.rows ?? {};
  const tierLookup = buildTierLookup(tierRows);

  const resolve = (md: string) =>
    resolveWikiRefsInMarkdown(md, tableIndex, constructTableId, constructRows, conceptsTableId, conceptRows, tierLookup);

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
