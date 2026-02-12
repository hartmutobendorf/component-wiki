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
  const services = createServices(createCodaClient(config.baseUrl, apiToken));
  console.log(`Doc: ${config.docId}, Tables: ${Object.keys(config.tables).join(", ")}\n`);

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
    console.log(`  ${tableName}: ${Object.keys(normalized).length} rows normalized`);
  }
  console.log("");

  // ── Phase D: HTML Content ─────────────────────────────────────
  console.log("Phase D: Extracting HTML content...");
  const allHtmlImageUrls: string[] = [];

  // Find tables with htmlColumns config
  for (const [tableName, tableConfig] of Object.entries(config.tables)) {
    if (!tableConfig.htmlColumns || tableConfig.htmlColumns.length === 0) {
      continue;
    }

    console.log(`  Exporting HTML for ${tableName} columns: ${tableConfig.htmlColumns.join(", ")}`);
    const htmlContent = await extractHtmlColumns(
      services,
      config.docId,
      tableConfig
    );

    // ── Phase E: Convert + Merge ──────────────────────────────
    console.log("Phase E: Converting HTML to markdown and merging...");
    const normalizedRows = normalizedTables[tableName];

    for (const [componentName, columns] of htmlContent) {
      // Find the matching normalized row by name
      const row = Object.values(normalizedRows).find(
        (r) => r.name === componentName
      );
      if (!row) {
        console.log(`  No matching row for HTML content: "${componentName}"`);
        continue;
      }

      // Convert each HTML column to markdown
      for (const [columnName, html] of Object.entries(columns)) {
        const { markdown, imageUrls } = htmlToMarkdown(html);
        const camelKey = columnName
          .split(/\s+/)
          .map((w, i) =>
            i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          )
          .join("");

        // Store the markdown (will be finalized after image download)
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

  // Finalize HTML columns — replace placeholders with real paths
  for (const rows of Object.values(normalizedTables)) {
    for (const row of Object.values(rows)) {
      for (const [key, value] of Object.entries(row)) {
        if (key.startsWith("_html_") && value && typeof value === "object") {
          const { markdown, imageUrls } = value as {
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
      }

      // Also rewrite ImageCollector paths to downloaded paths
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "string" && value.startsWith("images/")) {
          // Check if this was a collector path that got remapped
          for (const img of imageCollector.getAll()) {
            if (img.localPath === value && urlToPath.has(img.url)) {
              row[key] = urlToPath.get(img.url)!;
              break;
            }
          }
        }
        // Also handle arrays of image paths
        if (Array.isArray(value)) {
          row[key] = value.map((item) => {
            if (typeof item === "string" && item.startsWith("images/")) {
              for (const img of imageCollector.getAll()) {
                if (img.localPath === item && urlToPath.has(img.url)) {
                  return urlToPath.get(img.url)!;
                }
              }
            }
            return item;
          });
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

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
