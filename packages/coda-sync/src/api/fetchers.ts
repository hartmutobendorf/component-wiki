/**
 * Paginated table fetchers — wraps the existing Coda services
 * to fetch all rows with valueFormat: "rich".
 */
import type { CodaServices } from "../coda/services";
import type { SyncConfig } from "../config";

interface RawRow {
  id: string;
  name: string;
  values: Record<string, unknown>;
  [key: string]: unknown;
}

interface FetchResult {
  items: RawRow[];
  nextPageToken?: string;
}

/**
 * Fetch all rows from a single table, handling pagination.
 */
export async function fetchAllRows(
  services: CodaServices,
  docId: string,
  tableId: string
): Promise<RawRow[]> {
  const allRows: RawRow[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const result = (await services.getTableRows(docId, tableId, {
      useColumnNames: true,
      valueFormat: "rich",
      limit: 200,
      pageToken,
    })) as FetchResult;

    const items = result.items || [];
    allRows.push(...items);
    pageToken = result.nextPageToken;

    console.log(
      `  Fetched ${items.length} rows (total: ${allRows.length})`
    );
  } while (pageToken);

  return allRows;
}

/**
 * Fetch all tables in parallel, returns a map of table name → rows.
 */
export async function fetchAllTables(
  services: CodaServices,
  docId: string,
  config: SyncConfig
): Promise<Record<string, RawRow[]>> {
  const entries = Object.entries(config.tables);

  const results = await Promise.all(
    entries.map(async ([name, tableConfig]) => {
      console.log(`Fetching ${name} (${tableConfig.id})...`);
      const rows = await fetchAllRows(services, docId, tableConfig.id);
      console.log(`  ${name}: ${rows.length} rows total`);
      return [name, rows] as const;
    })
  );

  return Object.fromEntries(results);
}
