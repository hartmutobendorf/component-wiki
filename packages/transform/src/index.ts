import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  componentSchema,
  rawComponentsTableSchema,
  rawPropertiesTableSchema,
  rawAnatomyTableSchema,
  rawChangeLogTableSchema,
  rawDecisionLogTableSchema,
  rawLookupTableSchema,
} from "@wiki/shared";
import { denormalize, type RawData } from "./denormalize.js";
import { buildMentionedIn } from "./mentioned-in.js";
import type { SyncConfig } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = resolve(__dirname, "../../../data/raw");
const OUTPUT_DIR = resolve(__dirname, "../../../data/components");

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

async function main() {
  console.log("📦 @wiki/transform — Denormalizing raw data...\n");

  // Read and validate all raw table files
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

  // Load sync config for wiki-ref:// link resolution.
  // The config contains table IDs needed to map wiki-ref://tableId/rowId
  // links to the correct table (components, properties, etc.) and resolve
  // them to final wiki paths (e.g., [Checkbox](/checkbox)).
  let syncConfig: SyncConfig | undefined;
  try {
    const configPath = resolve(__dirname, "../../coda-sync/coda.config.json");
    syncConfig = JSON.parse(readFileSync(configPath, "utf-8")) as SyncConfig;
    console.log("  Loaded coda.config.json for wiki-ref link resolution");
  } catch {
    console.warn(
      "  ⚠️  Could not load coda.config.json — wiki-ref:// links will not be resolved"
    );
  }

  // Denormalize
  const components = denormalize(raw, syncConfig);

  // Build "mentioned in" reverse index.
  // Scans all resolved markdown content for internal links (e.g., [Checkbox](/checkbox))
  // and builds a map of slug → list of components that mention it.
  const mentionedInCount = buildMentionedIn(components);
  if (mentionedInCount > 0) {
    console.log(`  ${mentionedInCount} components have "mentioned in" references`);
  }

  // Validate output and write
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let validCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const component of components) {
    const result = componentSchema.safeParse(component);
    if (!result.success) {
      errorCount++;
      const issues = result.error.issues
        .map((i) => `    ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      errors.push(`  ❌ ${component.name} (${component.slug}):\n${issues}`);
    }

    const outputPath = resolve(OUTPUT_DIR, `${component.slug}.json`);
    writeFileSync(outputPath, JSON.stringify(component, null, 2) + "\n");
    validCount++;
  }

  console.log(`\n✅ Wrote ${validCount} component files to data/components/`);

  if (errorCount > 0) {
    console.error(`\n⚠️  ${errorCount} output validation error(s):`);
    for (const e of errors) {
      console.error(e);
    }
  }

  // Summary
  const types = new Map<string, number>();
  for (const c of components) {
    types.set(c.type, (types.get(c.type) ?? 0) + 1);
  }
  console.log("\n📊 Summary by type:");
  for (const [type, count] of [...types.entries()].sort()) {
    console.log(`  ${type}: ${count}`);
  }
}

main().catch((err) => {
  console.error("Transform failed:", err);
  process.exit(1);
});
