import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  rawComponentsTableSchema,
  rawPropertiesTableSchema,
  rawAnatomyTableSchema,
  rawChangeLogTableSchema,
  rawDecisionLogTableSchema,
  rawLookupTableSchema,
} from "@wiki/shared";
import type { RawData } from "./denormalize.js";
import type { SyncConfig } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = resolve(__dirname, "../../../../data/raw");

function readAndValidate<T>(
  filename: string,
  schema: { parse: (data: unknown) => T },
  label: string,
): T {
  const path = resolve(RAW_DIR, filename);
  const json = JSON.parse(readFileSync(path, "utf-8"));
  try {
    return schema.parse(json);
  } catch (err) {
    throw new Error(
      `Validation failed for ${label} (${filename}):\n${err}`,
    );
  }
}

export function loadRawData(): { raw: RawData; syncConfig?: SyncConfig } {
  const raw: RawData = {
    components: readAndValidate("components.json", rawComponentsTableSchema, "components"),
    properties: readAndValidate("properties.json", rawPropertiesTableSchema, "properties"),
    changelog: readAndValidate("changelog.json", rawChangeLogTableSchema, "changelog"),
    anatomy: readAndValidate("anatomy.json", rawAnatomyTableSchema, "anatomy"),
    decisionLog: readAndValidate("decisionLog.json", rawDecisionLogTableSchema, "decisionLog"),
    types: readAndValidate("types.json", rawLookupTableSchema, "types"),
    tiers: readAndValidate("tiers.json", rawLookupTableSchema, "tiers"),
    documentationStatuses: readAndValidate("documentationStatuses.json", rawLookupTableSchema, "documentationStatuses"),
    propertyTypes: readAndValidate("propertyTypes.json", rawLookupTableSchema, "propertyTypes"),
    editors: readAndValidate("editors.json", rawLookupTableSchema, "editors"),
  };

  console.log(
    `  Raw tables loaded and validated: ${Object.keys(raw.components.rows).length} components, ` +
      `${Object.keys(raw.properties.rows).length} properties, ` +
      `${Object.keys(raw.changelog.rows).length} changelog entries, ` +
      `${Object.keys(raw.anatomy.rows).length} anatomy parts, ` +
      `${Object.keys(raw.decisionLog.rows).length} decision log entries`,
  );

  let syncConfig: SyncConfig | undefined;
  try {
    const configPath = resolve(__dirname, "../../../coda-sync/coda.config.json");
    syncConfig = JSON.parse(readFileSync(configPath, "utf-8")) as SyncConfig;
    console.log("  Loaded coda.config.json for wiki-ref link resolution");
  } catch {
    console.warn(
      "  ⚠️  Could not load coda.config.json — wiki-ref:// links will not be resolved"
    );
  }

  return { raw, syncConfig };
}
