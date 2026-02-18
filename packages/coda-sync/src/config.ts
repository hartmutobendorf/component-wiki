import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface TableConfig {
  id: string;
  pageId?: string;
  htmlColumns?: string[];
  relatesTo?: string | string[];
}

export interface SyncConfig {
  baseUrl: string;
  docId: string;
  tables: Record<string, TableConfig>;
}

/**
 * Load sync configuration from coda.config.json
 */
export function loadConfig(): SyncConfig {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const configPath = resolve(__dirname, "../coda.config.json");
  const raw = readFileSync(configPath, "utf-8");
  const config: SyncConfig = JSON.parse(raw);

  if (!config.baseUrl) {
    throw new Error("coda.config.json: missing baseUrl");
  }
  if (!config.docId) {
    throw new Error("coda.config.json: missing docId");
  }
  if (!config.tables || Object.keys(config.tables).length === 0) {
    throw new Error("coda.config.json: missing tables");
  }
  for (const [name, table] of Object.entries(config.tables)) {
    if (!table.id) {
      throw new Error(`coda.config.json: table "${name}" missing id`);
    }
  }

  return config;
}

/**
 * Get the Coda API token from environment (the only secret)
 */
export function getApiToken(): string {
  const token = process.env.CODA_API_TOKEN;
  if (!token) {
    throw new Error(
      "CODA_API_TOKEN environment variable is not set.\n" +
        "Get your token at: https://coda.io/account"
    );
  }
  return token;
}
