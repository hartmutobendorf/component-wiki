/**
 * HTML content extraction — exports a Coda page as HTML, parses the table,
 * and extracts only the columns listed in htmlColumns config.
 */
import * as cheerio from "cheerio";
import type { CodaServices } from "../coda/services";
import type { TableConfig } from "../config";

/**
 * Extract HTML content for specific columns from a Coda page export.
 *
 * Returns a map of component name → { [columnName]: htmlString }
 */
export async function extractHtmlColumns(
  services: CodaServices,
  docId: string,
  tableConfig: TableConfig
): Promise<Map<string, Record<string, string>>> {
  if (!tableConfig.pageId) {
    throw new Error("tableConfig.pageId is required for HTML export");
  }
  if (!tableConfig.htmlColumns || tableConfig.htmlColumns.length === 0) {
    return new Map();
  }

  console.log("Exporting page content as HTML...");
  const pageHtml = await services.exportPageContent(
    docId,
    tableConfig.pageId,
    "html"
  );
  console.log("Page content exported");

  return parseHtmlTable(pageHtml, tableConfig.htmlColumns);
}

/**
 * Parse the HTML table and extract specified columns.
 */
function parseHtmlTable(
  pageHtml: string,
  htmlColumns: string[]
): Map<string, Record<string, string>> {
  const $ = cheerio.load(pageHtml);
  const result = new Map<string, Record<string, string>>();

  const table = $("table[data-coda-grid-id]").first();
  if (!table.length) {
    console.log("No table found in HTML export");
    return result;
  }

  // Get column names from header
  const columnNames: string[] = [];
  table.find("thead th").each((_, th) => {
    columnNames.push($(th).text().trim());
  });

  // Map column names to indices
  const columnMap: Record<string, number> = {};
  columnNames.forEach((name, index) => {
    columnMap[name] = index;
  });

  // Verify requested columns exist
  const nameIndex = columnMap["Name"];
  if (nameIndex === undefined) {
    console.log("No 'Name' column found in HTML table");
    return result;
  }

  const columnIndices: Array<{ name: string; index: number }> = [];
  for (const col of htmlColumns) {
    if (columnMap[col] !== undefined) {
      columnIndices.push({ name: col, index: columnMap[col] });
    } else {
      console.log(`Column "${col}" not found in HTML table`);
    }
  }

  // Extract data from each row
  table.find("tbody tr").each((_, tr) => {
    const $tr = $(tr);
    const cells = $tr.find("td");

    const name = cells.eq(nameIndex).text().trim();
    if (!name) return;

    const columns: Record<string, string> = {};
    for (const { name: colName, index } of columnIndices) {
      columns[colName] = cells.eq(index).html() || "";
    }

    result.set(name, columns);
  });

  console.log(`Extracted HTML columns for ${result.size} rows`);
  return result;
}
