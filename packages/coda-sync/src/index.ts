import "dotenv/config";

import { writeFile, mkdir, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadConfig, getApiToken } from "./config";
import { createCodaClient } from "./coda/client";
import { createServices } from "./coda/services";
import { fetchAllTables } from "./api/fetchers";
import {
  ImageCollector,
  normalizeRow,
  type NormalizedRow,
} from "./api/normalize";
import { extractHtmlColumns } from "./html/export";
import { htmlToMarkdown, replaceImagePlaceholders } from "./html/turndown";
import { downloadAllImages } from "./html/images";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_RAW_DIR = resolve(__dirname, "../../../data/raw");

export async function sync() {
  // ── Phase A: Load Config ──────────────────────────────────────
  console.log("Phase A: Loading config...");
  const config = loadConfig();
  const apiToken = getApiToken();
  const services = createServices(createCodaClient(config.baseUrl, apiToken), apiToken);
  console.log(
    `  Doc: ${config.docId}, Tables: ${Object.keys(config.tables).join(", ")}\n`
  );

  // ── Phase B: API Fetch ────────────────────────────────────────
  console.log("Phase B: Fetching all tables (rich format)...");
  const rawTables = await fetchAllTables(services, config.docId, config);
  console.log("");

  // ── Phase C: Normalize ────────────────────────────────────────
  console.log("Phase C: Normalizing values...");
  const imageCollector = new ImageCollector();
  const normalizedTables: Record<string, Record<string, NormalizedRow>> = {};

  for (const [tableName, rows] of Object.entries(rawTables)) {
    const normalized: Record<string, NormalizedRow> = {};
    for (const row of rows) {
      const normalizedRow = normalizeRow(
        row.id,
        row.values as Record<string, unknown>,
        imageCollector
      );
      normalized[row.id] = normalizedRow;
    }
    normalizedTables[tableName] = normalized;
    console.log(
      `  ${tableName}: ${Object.keys(normalized).length} rows normalized`
    );
  }
  console.log("");

  // ── Phase D + E: HTML Content Extraction + Conversion ─────────
  console.log("Phase D: Extracting HTML content...");
  const allHtmlImageUrls: string[] = [];

  for (const [tableName, tableConfig] of Object.entries(config.tables)) {
    if (!tableConfig.htmlColumns || tableConfig.htmlColumns.length === 0) {
      continue;
    }

    console.log(
      `  Exporting HTML for ${tableName} columns: ${tableConfig.htmlColumns.join(", ")}`
    );
    const htmlContent = await extractHtmlColumns(
      services,
      config.docId,
      tableConfig
    );

    console.log("Phase E: Converting HTML to markdown and merging...");
    const normalizedRows = normalizedTables[tableName];

    // Build a name → row lookup for O(1) matching
    const nameToRow = new Map<string, NormalizedRow>();
    for (const row of Object.values(normalizedRows)) {
      if (typeof row.name === "string") {
        nameToRow.set(row.name, row);
      }
    }

    for (const [componentName, columns] of htmlContent) {
      const row = nameToRow.get(componentName);
      if (!row) {
        console.log(
          `  No matching row for HTML content: "${componentName}"`
        );
        continue;
      }

      for (const [columnName, html] of Object.entries(columns)) {
        const { markdown, imageUrls } = htmlToMarkdown(html);
        const camelKey = toCamelCase(columnName);

        // Store temporarily for finalization after image download
        row[`_html_${camelKey}`] = { markdown, imageUrls };
        allHtmlImageUrls.push(...imageUrls);
      }
    }
  }
  console.log("");

  // ── Phase F: Images ───────────────────────────────────────────
  console.log("Phase F: Downloading images...");
  const imagesDir = resolve(DATA_RAW_DIR, "images");
  await rm(imagesDir, { recursive: true, force: true });

  const urlToPath = await downloadAllImages(
    imageCollector.getAll(),
    allHtmlImageUrls,
    imagesDir
  );

  // Build a reverse lookup: collector localPath → downloaded localPath
  // This handles the case where ImageCollector pre-assigned paths
  // that may differ from the final downloaded paths
  const collectorPathToFinal = new Map<string, string>();
  for (const img of imageCollector.getAll()) {
    const finalPath = urlToPath.get(img.url);
    if (finalPath) {
      collectorPathToFinal.set(img.localPath, finalPath);
    }
  }

  // Finalize all rows: replace HTML placeholders and remap collector paths
  for (const rows of Object.values(normalizedTables)) {
    for (const row of Object.values(rows)) {
      // Replace HTML column placeholders with downloaded paths
      for (const key of Object.keys(row)) {
        if (!key.startsWith("_html_")) continue;
        const { markdown, imageUrls } = row[key] as {
          markdown: string;
          imageUrls: string[];
        };
        const camelKey = key.slice("_html_".length);
        row[camelKey] = replaceImagePlaceholders(
          markdown,
          urlToPath,
          imageUrls
        );
        delete row[key];
      }

      // Remap ImageCollector placeholder paths to final downloaded paths
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "string" && collectorPathToFinal.has(value)) {
          row[key] = collectorPathToFinal.get(value)!;
        } else if (Array.isArray(value)) {
          row[key] = value.map((item) =>
            typeof item === "string" && collectorPathToFinal.has(item)
              ? collectorPathToFinal.get(item)!
              : item
          );
        }
      }
    }
  }
  console.log("");

  // ── Phase G: Write ────────────────────────────────────────────
  console.log("Phase G: Writing JSON files...");
  await mkdir(DATA_RAW_DIR, { recursive: true });

  for (const [tableName, rows] of Object.entries(normalizedTables)) {
    const output = {
      fetchedAt: new Date().toISOString(),
      rows,
    };
    const filePath = resolve(DATA_RAW_DIR, `${tableName}.json`);
    await writeFile(filePath, JSON.stringify(output, null, 2));
    console.log(`  ${filePath} (${Object.keys(rows).length} rows)`);
  }

  console.log("\nDone!");
}

/**
 * Convert a column name to camelCase.
 */
function toCamelCase(name: string): string {
  return name
    .split(/\s+/)
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
