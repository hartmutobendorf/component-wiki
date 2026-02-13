/**
 * Temporary script: fetch Accordion's "Usage" field from both
 * the Coda structured API and the HTML page export, so we can
 * compare how links appear in each.
 *
 * Run: npx tsx scripts/check-accordion-usage.ts
 */
import { config as loadEnv } from "../packages/coda-sync/node_modules/dotenv/lib/main.js";
loadEnv({ path: "packages/coda-sync/.env" });
import { loadConfig, getApiToken } from "../packages/coda-sync/src/config.js";
import { createCodaClient } from "../packages/coda-sync/src/coda/client.js";
import { createServices } from "../packages/coda-sync/src/coda/services/index.js";
import { fetchAllRows } from "../packages/coda-sync/src/api/fetchers.js";
import { extractHtmlColumns } from "../packages/coda-sync/src/html/export.js";
import { htmlToMarkdown } from "../packages/coda-sync/src/html/turndown.js";

async function main() {
  const config = loadConfig();
  const apiToken = getApiToken();
  const client = createCodaClient(config.baseUrl, apiToken);
  const services = createServices(client, apiToken);

  const componentsTable = config.tables.components;

  // --- 1. API rich format ---
  console.log("=== Fetching from API (valueFormat: rich) ===\n");
  const rows = await fetchAllRows(services, config.docId, componentsTable.id);
  const accordion = rows.find((r) => r.name === "Accordion");

  if (!accordion) {
    console.log("Accordion not found in API rows");
    return;
  }

  const apiUsage = accordion.values["Usage"];
  console.log("--- API Usage (raw value) ---");
  console.log(JSON.stringify(apiUsage, null, 2));
  console.log();

  // --- 2. HTML export ---
  console.log("=== Fetching from HTML export ===\n");
  const htmlMap = await extractHtmlColumns(services, config.docId, componentsTable);
  const accordionHtml = htmlMap.get("Accordion");

  if (!accordionHtml || !accordionHtml["Usage"]) {
    console.log("Accordion Usage not found in HTML export");
    return;
  }

  const rawHtml = accordionHtml["Usage"];
  console.log("--- HTML Usage (raw HTML) ---");
  console.log(rawHtml);
  console.log();

  // --- 3. HTML converted to markdown ---
  const { markdown, imageUrls } = htmlToMarkdown(rawHtml);
  console.log("--- HTML Usage (converted to markdown) ---");
  console.log(markdown);
  if (imageUrls.length > 0) {
    console.log("\nImage URLs found:", imageUrls);
  }

  // --- 4. Search for links in both ---
  console.log("\n=== Link detection ===\n");

  const apiStr = typeof apiUsage === "string" ? apiUsage : JSON.stringify(apiUsage);
  const linkPatternMd = /\[([^\]]*)\]\(([^)]*)\)/g;
  const linkPatternHtml = /<a[^>]+href="([^"]*)"[^>]*>([^<]*)<\/a>/g;

  console.log("Links in API value:");
  let match;
  while ((match = linkPatternMd.exec(apiStr)) !== null) {
    console.log(`  text: "${match[1]}" → href: ${match[2]}`);
  }
  // Also check for href in raw API (might be structured)
  if (apiStr.includes("href") || apiStr.includes("url") || apiStr.includes("http")) {
    console.log("  (API value contains URL-like content — see raw value above)");
  }

  console.log("\nLinks in raw HTML:");
  while ((match = linkPatternHtml.exec(rawHtml)) !== null) {
    console.log(`  text: "${match[2]}" → href: ${match[1]}`);
  }

  console.log("\nLinks in converted markdown:");
  while ((match = linkPatternMd.exec(markdown)) !== null) {
    console.log(`  text: "${match[1]}" → href: ${match[2]}`);
  }
}

main().catch(console.error);
