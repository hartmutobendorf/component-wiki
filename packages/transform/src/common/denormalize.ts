import type {
  Construct,
  Concept,
  Property,
  ChangeLogEntry,
  DecisionLogEntry,
  AnatomyPart,
  ChildPropertyGroup,
  RawConstructRow,
  RawConstructPropertyRow,
  RawConstructAnatomyRow,
  RawDocumentationChangelogRow,
  RawDocumentationDecisionlogRow,
  RawLookupRow,
  RawConceptRow,
  RawConstructTable,
  RawConstructPropertiesTable,
  RawConstructAnatomyTable,
  RawDocumentationChangelogTable,
  RawDocumentationDecisionlogTable,
  RawConstructTypesTable,
  RawDocumentationTiersTable,
  RawDocumentationStatusTable,
  RawDocumentationEditorsTable,
  RawConstructPropertyTypesTable,
  RawConceptsTable,
  RawRulesTable,
  RawConceptTypesTable,
  RawDocumentationRequirementLevelsTable,
  RawRuleStatusTable,
  RawRuleTypesTable,
} from "@wiki/shared";
import { resolveAllWikiRefs } from "./resolve-links.js";
import type { SyncConfig } from "./types.js";

// --- Input shape for denormalize ---

export interface RawData {
  construct: RawConstructTable;
  constructProperties: RawConstructPropertiesTable;
  constructAnatomy: RawConstructAnatomyTable;
  constructTypes: RawConstructTypesTable;
  constructPropertyTypes: RawConstructPropertyTypesTable;
  documentationChangelog: RawDocumentationChangelogTable;
  documentationDecisionlog: RawDocumentationDecisionlogTable;
  documentationStatus: RawDocumentationStatusTable;
  documentationTiers: RawDocumentationTiersTable;
  documentationEditors: RawDocumentationEditorsTable;
  concepts: RawConceptsTable;
  rules: RawRulesTable;
  conceptTypes: RawConceptTypesTable;
  documentationRequirementLevels: RawDocumentationRequirementLevelsTable;
  ruleStatus: RawRuleStatusTable;
  ruleTypes: RawRuleTypesTable;
}

// --- Helpers ---

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function lookupName(
  rows: Record<string, RawLookupRow>,
  rowId: string,
): string {
  const row = rows[rowId];
  return row?.name?.trim() ?? "";
}

function resolveImage(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] ?? "";
  return value;
}

function parseOptions(options: string): string[] {
  if (!options || !options.trim()) return [];
  return options
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function toStringArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

/** Build all raw tables into a single lookup for wiki-ref resolution. */
function buildAllRawTables(raw: RawData): Record<string, { rows: Record<string, Record<string, unknown>> }> {
  return {
    construct: raw.construct,
    constructProperties: raw.constructProperties,
    constructAnatomy: raw.constructAnatomy,
    constructTypes: raw.constructTypes,
    constructPropertyTypes: raw.constructPropertyTypes,
    documentationChangelog: raw.documentationChangelog,
    documentationDecisionlog: raw.documentationDecisionlog,
    documentationStatus: raw.documentationStatus,
    documentationTiers: raw.documentationTiers,
    documentationEditors: raw.documentationEditors,
    concepts: raw.concepts,
    rules: raw.rules,
    conceptTypes: raw.conceptTypes,
    documentationRequirementLevels: raw.documentationRequirementLevels,
    ruleStatus: raw.ruleStatus,
    ruleTypes: raw.ruleTypes,
  };
}

// --- Transform functions ---

function transformProperty(
  row: RawConstructPropertyRow,
  propertyTypeRows: Record<string, RawLookupRow>,
): Property {
  const typeName = lookupName(propertyTypeRows, row.type).toLowerCase();
  const typeMap: Record<string, Property["type"]> = {
    boolean: "boolean",
    string: "string",
    number: "number",
    "single select": "single select",
    "multi select": "multi select",
    slot: "slot",
    object: "object",
    callback: "callback",
  };
  const type = typeMap[typeName] ?? "string";

  const defaultOpt = typeof row.defaultOption === "boolean"
    ? String(row.defaultOption)
    : (row.defaultOption ?? "");

  const prop: Property = {
    name: row.name ?? "",
    required: row.required ?? false,
    type,
    description: row.description ?? "",
    constraint: row.constraint ?? "",
    defaultOption: defaultOpt.trim(),
  };

  const options = parseOptions(row.options ?? "");
  if (options.length > 0) {
    prop.options = options;
  }

  return prop;
}

function transformChangelog(
  row: RawDocumentationChangelogRow,
  editorRows: Record<string, RawLookupRow>,
): ChangeLogEntry {
  return {
    who: lookupName(editorRows, row.who) || row.who || "",
    when: row.when ?? "",
    what: row.what ?? "",
  };
}

function transformDecisionLog(row: RawDocumentationDecisionlogRow): DecisionLogEntry {
  return {
    where: row.where ?? "",
    what: row.what ?? "",
    link: row.link ?? "",
    when: row.when ?? "",
  };
}

function transformAnatomyPart(row: RawConstructAnatomyRow): AnatomyPart {
  return {
    number: row.number ?? 0,
    name: row.name ?? "",
    description: row.description ?? "",
  };
}

// --- Construct denormalization ---

export function denormalizeConstructs(raw: RawData, syncConfig?: SyncConfig): Construct[] {
  const {
    construct,
    constructProperties,
    documentationChangelog,
    constructAnatomy,
    documentationDecisionlog,
    constructTypes,
    documentationTiers,
    documentationStatus,
    constructPropertyTypes,
    documentationEditors,
  } = raw;

  const results: Construct[] = [];
  const warnings: string[] = [];

  for (const [rowId, comp] of Object.entries(construct.rows)) {
    // Resolve type name
    const typeName = lookupName(constructTypes.rows as Record<string, RawLookupRow>, comp.type);

    // Filter out "Block" type constructs
    if (typeName === "Block") {
      continue;
    }

    // Resolve lookup values
    const tierName = lookupName(documentationTiers.rows as Record<string, RawLookupRow>, comp.tiers);
    const docStatus = lookupName(documentationStatus.rows as Record<string, RawLookupRow>, comp.documentationStatus);

    // Generate slug
    const slug = generateSlug(comp.name);

    // Join properties by rowId
    const propertyIds = toStringArray(comp.properties);
    const constructPropertyList: Property[] = propertyIds
      .map((id) => {
        const propRow = constructProperties.rows[id];
        if (!propRow) {
          warnings.push(`[${comp.name}] Missing property rowId: ${id}`);
          return null;
        }
        return transformProperty(propRow, constructPropertyTypes.rows as Record<string, RawLookupRow>);
      })
      .filter((p): p is Property => p !== null);

    // Join changelog by rowId
    const changeLogIds = toStringArray(comp.changeLog);
    const constructChangelog: ChangeLogEntry[] = changeLogIds
      .map((id) => {
        const clRow = documentationChangelog.rows[id];
        if (!clRow) {
          warnings.push(`[${comp.name}] Missing changelog rowId: ${id}`);
          return null;
        }
        return transformChangelog(clRow, documentationEditors.rows as Record<string, RawLookupRow>);
      })
      .filter((c): c is ChangeLogEntry => c !== null);

    // Join anatomy by rowId
    const anatomyIds = toStringArray(comp.anatomy);
    const anatomyParts: AnatomyPart[] = anatomyIds
      .map((id) => {
        const anatRow = constructAnatomy.rows[id];
        if (!anatRow) {
          warnings.push(`[${comp.name}] Missing anatomy rowId: ${id}`);
          return null;
        }
        return transformAnatomyPart(anatRow);
      })
      .filter((a): a is AnatomyPart => a !== null)
      .sort((a, b) => a.number - b.number);

    // Join decision log by rowId
    const decisionLogIds = toStringArray(comp.decisionLog);
    const constructDecisionLog: DecisionLogEntry[] = decisionLogIds
      .map((id) => {
        const dlRow = documentationDecisionlog.rows[id];
        if (!dlRow) {
          warnings.push(`[${comp.name}] Missing decisionLog rowId: ${id}`);
          return null;
        }
        return transformDecisionLog(dlRow);
      })
      .filter((d): d is DecisionLogEntry => d !== null);

    // Resolve child properties (from uiBlocksUsedInPattern)
    const blockIds = toStringArray(comp.uiBlocksUsedInPattern);
    let childProperties: ChildPropertyGroup[] | undefined;
    if (blockIds.length > 0) {
      childProperties = blockIds
        .map((blockId) => {
          const blockRow = construct.rows[blockId];
          if (!blockRow) {
            warnings.push(`[${comp.name}] Missing block rowId: ${blockId}`);
            return null;
          }
          const blockPropertyIds = toStringArray(blockRow.properties);
          const blockProps = blockPropertyIds
            .map((propId) => {
              const propRow = constructProperties.rows[propId];
              if (!propRow) {
                warnings.push(
                  `[${comp.name}] Missing block property rowId: ${propId}`,
                );
                return null;
              }
              return transformProperty(propRow, constructPropertyTypes.rows as Record<string, RawLookupRow>);
            })
            .filter((p): p is Property => p !== null);

          return {
            name: blockRow.name,
            properties: blockProps,
          };
        })
        .filter(
          (g): g is ChildPropertyGroup =>
            g !== null && g.properties.length > 0,
        );

      if (childProperties.length === 0) {
        childProperties = undefined;
      }
    }

    // Build anatomy object
    const anatomyImage = resolveImage(comp.anatomyImage);
    const anatomyObj =
      anatomyParts.length > 0 || anatomyImage
        ? { image: anatomyImage, table: anatomyParts }
        : undefined;

    // Resolve wiki-ref:// links in markdown content fields
    const rawMarkdownFields = {
      description: comp.description ?? "",
      usage: comp.usage ?? "",
      examples: comp.examples ?? "",
      interactions: comp.interactions ?? "",
    };

    const allRawTables = buildAllRawTables(raw);

    const resolvedFields = syncConfig
      ? resolveAllWikiRefs(rawMarkdownFields, syncConfig, allRawTables)
      : rawMarkdownFields;

    // Build construct
    const result: Construct = {
      name: comp.name,
      slug,
      type: typeName as Construct["type"],
      tiers: tierName as Construct["tiers"],
      documentationStatus: docStatus as Construct["documentationStatus"],
      lastEdited: comp.lastEdited ?? "",
      figmaLink: comp.figma ?? "",
      codeLink: comp.code ?? "",
      description: resolvedFields.description,
      usage: resolvedFields.usage,
      examples: resolvedFields.examples,
      interactions: resolvedFields.interactions,
      figmaComponentData: comp.figmaComponentData ?? "",
      componentExampleImage: resolveImage(comp.componentExampleImage),
      sitesArchitectureLevels: comp["sites-ArchitectureLevels"] ?? "",
      anatomy: anatomyObj,
      properties: constructPropertyList,
      childProperties,
      changeLog: constructChangelog,
      decisionLog: constructDecisionLog,
      appliedRules: toStringArray(comp.appliedRule),
      exceptionFromRules: toStringArray(comp.exceptionFromRule),
      mentionedIn: [],
    };

    results.push(result);
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn(
      `\n⚠️  ${warnings.length} construct warning(s) during denormalization:`,
    );
    for (const w of warnings) {
      console.warn(`  ${w}`);
    }
  }

  return results;
}

// --- Concept denormalization ---

export function denormalizeConcepts(raw: RawData, syncConfig?: SyncConfig): Concept[] {
  const {
    concepts,
    conceptTypes,
    documentationStatus,
    documentationTiers,
    documentationChangelog,
    documentationDecisionlog,
    documentationEditors,
  } = raw;

  const results: Concept[] = [];
  const warnings: string[] = [];

  for (const [rowId, conc] of Object.entries(concepts.rows)) {
    // Resolve lookup values
    const typeName = lookupName(conceptTypes.rows as Record<string, RawLookupRow>, conc.type);
    const tierName = lookupName(documentationTiers.rows as Record<string, RawLookupRow>, conc.tier);
    const docStatus = lookupName(documentationStatus.rows as Record<string, RawLookupRow>, conc.documentationStatus);

    const slug = generateSlug(conc.name);

    // Join changelog by rowId
    const changeLogIds = toStringArray(conc.changelog);
    const conceptChangelog: ChangeLogEntry[] = changeLogIds
      .map((id) => {
        const clRow = documentationChangelog.rows[id];
        if (!clRow) {
          warnings.push(`[${conc.name}] Missing changelog rowId: ${id}`);
          return null;
        }
        return transformChangelog(clRow, documentationEditors.rows as Record<string, RawLookupRow>);
      })
      .filter((c): c is ChangeLogEntry => c !== null);

    // Join decision log by rowId
    const decisionLogIds = toStringArray(conc.decisionlog);
    const conceptDecisionLog: DecisionLogEntry[] = decisionLogIds
      .map((id) => {
        const dlRow = documentationDecisionlog.rows[id];
        if (!dlRow) {
          warnings.push(`[${conc.name}] Missing decisionLog rowId: ${id}`);
          return null;
        }
        return transformDecisionLog(dlRow);
      })
      .filter((d): d is DecisionLogEntry => d !== null);

    // Resolve wiki-ref:// links in markdown content fields
    const rawMarkdownFields = {
      description: conc.description ?? "",
      usage: "",
      examples: "",
      interactions: "",
      content: conc.content ?? "",
    };

    const allRawTables = buildAllRawTables(raw);

    const resolvedFields = syncConfig
      ? resolveAllWikiRefs(rawMarkdownFields, syncConfig, allRawTables)
      : rawMarkdownFields;

    const result: Concept = {
      name: conc.name,
      slug,
      type: typeName,
      tier: tierName,
      documentationStatus: docStatus,
      lastEdited: conc.lastEdited ?? "",
      description: resolvedFields.description,
      content: resolvedFields.content ?? conc.content ?? "",
      changeLog: conceptChangelog,
      decisionLog: conceptDecisionLog,
      appliedRules: toStringArray(conc.appliedRule),
      exceptedFromRules: toStringArray(conc.exceptedFromRule),
      mentionedIn: [],
    };

    results.push(result);
  }

  if (warnings.length > 0) {
    console.warn(
      `\n⚠️  ${warnings.length} concept warning(s) during denormalization:`,
    );
    for (const w of warnings) {
      console.warn(`  ${w}`);
    }
  }

  return results;
}
