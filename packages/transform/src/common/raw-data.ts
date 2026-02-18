import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  rawConstructTableSchema,
  rawConstructPropertiesTableSchema,
  rawConstructAnatomyTableSchema,
  rawDocumentationChangelogTableSchema,
  rawDocumentationDecisionlogTableSchema,
  rawDocumentationStatusTableSchema,
  rawConstructTypesTableSchema,
  rawDocumentationTiersTableSchema,
  rawDocumentationEditorsTableSchema,
  rawConstructPropertyTypesTableSchema,
  rawConceptsTableSchema,
  rawRulesTableSchema,
  rawConceptTypesTableSchema,
  rawDocumentationRequirementLevelsTableSchema,
  rawRuleStatusTableSchema,
  rawRuleTypesTableSchema,
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
    construct: readAndValidate("construct.json", rawConstructTableSchema, "construct"),
    constructProperties: readAndValidate("constructProperties.json", rawConstructPropertiesTableSchema, "constructProperties"),
    constructAnatomy: readAndValidate("constructAnatomy.json", rawConstructAnatomyTableSchema, "constructAnatomy"),
    constructTypes: readAndValidate("constructTypes.json", rawConstructTypesTableSchema, "constructTypes"),
    constructPropertyTypes: readAndValidate("constructPropertyTypes.json", rawConstructPropertyTypesTableSchema, "constructPropertyTypes"),
    documentationChangelog: readAndValidate("documentationChangelog.json", rawDocumentationChangelogTableSchema, "documentationChangelog"),
    documentationDecisionlog: readAndValidate("documentationDecisionlog.json", rawDocumentationDecisionlogTableSchema, "documentationDecisionlog"),
    documentationStatus: readAndValidate("documentationStatus.json", rawDocumentationStatusTableSchema, "documentationStatus"),
    documentationTiers: readAndValidate("documentationTiers.json", rawDocumentationTiersTableSchema, "documentationTiers"),
    documentationEditors: readAndValidate("documentationEditors.json", rawDocumentationEditorsTableSchema, "documentationEditors"),
    concepts: readAndValidate("concepts.json", rawConceptsTableSchema, "concepts"),
    rules: readAndValidate("rules.json", rawRulesTableSchema, "rules"),
    conceptTypes: readAndValidate("conceptTypes.json", rawConceptTypesTableSchema, "conceptTypes"),
    documentationRequirementLevels: readAndValidate("documentationRequirementLevels.json", rawDocumentationRequirementLevelsTableSchema, "documentationRequirementLevels"),
    ruleStatus: readAndValidate("ruleStatus.json", rawRuleStatusTableSchema, "ruleStatus"),
    ruleTypes: readAndValidate("ruleTypes.json", rawRuleTypesTableSchema, "ruleTypes"),
  };

  console.log(
    `  Raw tables loaded and validated: ${Object.keys(raw.construct.rows).length} constructs, ` +
      `${Object.keys(raw.concepts.rows).length} concepts, ` +
      `${Object.keys(raw.constructProperties.rows).length} properties, ` +
      `${Object.keys(raw.documentationChangelog.rows).length} changelog entries, ` +
      `${Object.keys(raw.constructAnatomy.rows).length} anatomy parts, ` +
      `${Object.keys(raw.documentationDecisionlog.rows).length} decision log entries, ` +
      `${Object.keys(raw.rules.rows).length} rules`,
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
