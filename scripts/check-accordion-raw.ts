/**
 * Temporary script: show raw API and HTML responses for Accordion's Usage field.
 *
 * Run: npx tsx scripts/check-accordion-raw.ts
 */
import { config as loadEnv } from "../packages/coda-sync/node_modules/dotenv/lib/main.js";
loadEnv({ path: "packages/coda-sync/.env" });
import { loadConfig, getApiToken } from "../packages/coda-sync/src/config.js";
import { createCodaClient } from "../packages/coda-sync/src/coda/client.js";
import { createServices } from "../packages/coda-sync/src/coda/services/index.js";

async function main() {
  const config = loadConfig();
  const apiToken = getApiToken();
  const client = createCodaClient(config.baseUrl, apiToken);
  const services = createServices(client, apiToken);

  const componentsTable = config.tables.components;

  // --- 1. Raw API row for Accordion (just Usage + Description columns) ---
  console.log("========================================");
  console.log("  RAW API RESPONSE (valueFormat: rich)");
  console.log("========================================\n");

  const result = await services.getTableRows(config.docId, componentsTable.id, {
    useColumnNames: true,
    valueFormat: "rich",
    limit: 200,
  }) as { items: any[] };

  const accordion = result.items.find((r: any) => r.name === "Accordion");
  if (!accordion) {
    console.log("Accordion not found");
    return;
  }

  // Show only relevant fields, not the huge figma blob
  const { Usage, Description } = accordion.values;
  console.log("--- accordion.values.Usage ---");
  console.log(JSON.stringify(Usage, null, 2));
  console.log("\n--- accordion.values.Description ---");
  console.log(JSON.stringify(Description, null, 2));

  // --- 2. Raw HTML for just the Accordion Usage cell ---
  console.log("\n\n========================================");
  console.log("  RAW HTML EXPORT (Accordion row only)");
  console.log("========================================\n");

  const pageHtml = await services.exportPageContent(
    config.docId,
    componentsTable.pageId!,
    "html"
  );

  // Parse the table to extract just the Accordion Usage cell HTML
  const cheerio = await import("../packages/coda-sync/node_modules/cheerio/dist/esm/index.js");
  const $ = cheerio.load(pageHtml);

  const table = $("table[data-coda-grid-id]").first();
  const columnNames: string[] = [];
  table.find("thead th").each((_, th) => {
    columnNames.push($(th).text().trim());
  });

  const usageIdx = columnNames.indexOf("Usage");
  const descIdx = columnNames.indexOf("Description");
  const nameIdx = columnNames.indexOf("Name");

  table.find("tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    const name = cells.eq(nameIdx).text().trim();
    if (name !== "Accordion") return;

    if (usageIdx !== -1) {
      console.log("--- Usage cell HTML ---");
      console.log(cells.eq(usageIdx).html());
    }
    if (descIdx !== -1) {
      console.log("\n--- Description cell HTML ---");
      console.log(cells.eq(descIdx).html());
    }
  });
}

main().catch(console.error);
