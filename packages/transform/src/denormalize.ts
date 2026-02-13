import type {
  Component,
  Property,
  ChangeLogEntry,
  DecisionLogEntry,
  AnatomyPart,
  ChildPropertyGroup,
  RawComponentRow,
  RawPropertyRow,
  RawAnatomyRow,
  RawChangeLogRow,
  RawDecisionLogRow,
  RawLookupRow,
  RawComponentsTable,
  RawPropertiesTable,
  RawAnatomyTable,
  RawChangeLogTable,
  RawDecisionLogTable,
  RawLookupTable,
} from "@wiki/shared";
import { resolveAllWikiRefs } from "./resolve-links.js";
import type { SyncConfig } from "./types.js";

// --- Input shape for denormalize ---

export interface RawData {
  components: RawComponentsTable;
  properties: RawPropertiesTable;
  changelog: RawChangeLogTable;
  anatomy: RawAnatomyTable;
  decisionLog: RawDecisionLogTable;
  types: RawLookupTable;
  tiers: RawLookupTable;
  documentationStatuses: RawLookupTable;
  propertyTypes: RawLookupTable;
  editors: RawLookupTable;
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

// --- Transform functions ---

function transformProperty(
  row: RawPropertyRow,
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
  row: RawChangeLogRow,
  editorRows: Record<string, RawLookupRow>,
): ChangeLogEntry {
  return {
    who: lookupName(editorRows, row.who) || row.who || "",
    when: row.when ?? "",
    what: row.what ?? "",
  };
}

function transformDecisionLog(row: RawDecisionLogRow): DecisionLogEntry {
  return {
    where: row.where ?? "",
    decisionMade: row.decisionMade ?? "",
    link: row.link ?? "",
  };
}

function transformAnatomyPart(row: RawAnatomyRow): AnatomyPart {
  return {
    number: row.number ?? 0,
    name: row.name ?? "",
    description: row.description ?? "",
  };
}

// --- Main denormalization ---

export function denormalize(raw: RawData, syncConfig?: SyncConfig): Component[] {
  const {
    components,
    properties,
    changelog,
    anatomy,
    decisionLog,
    types,
    tiers,
    documentationStatuses,
    propertyTypes,
    editors,
  } = raw;

  const results: Component[] = [];
  const warnings: string[] = [];

  for (const [rowId, comp] of Object.entries(components.rows)) {
    // Resolve type name
    const typeName = lookupName(types.rows, comp.type);

    // Filter out "Block" type components
    if (typeName === "Block") {
      continue;
    }

    // Resolve lookup values
    const tierName = lookupName(tiers.rows, comp.tiers);
    const docStatus = lookupName(documentationStatuses.rows, comp.documentationStatus);

    // Generate slug
    const slug = generateSlug(comp.name);

    // Join properties by rowId
    const propertyIds = toStringArray(comp.properties);
    const componentProperties: Property[] = propertyIds
      .map((id) => {
        const propRow = properties.rows[id];
        if (!propRow) {
          warnings.push(`[${comp.name}] Missing property rowId: ${id}`);
          return null;
        }
        return transformProperty(propRow, propertyTypes.rows);
      })
      .filter((p): p is Property => p !== null);

    // Join changelog by rowId
    const changeLogIds = toStringArray(comp.changeLog);
    const componentChangelog: ChangeLogEntry[] = changeLogIds
      .map((id) => {
        const clRow = changelog.rows[id];
        if (!clRow) {
          warnings.push(`[${comp.name}] Missing changelog rowId: ${id}`);
          return null;
        }
        return transformChangelog(clRow, editors.rows);
      })
      .filter((c): c is ChangeLogEntry => c !== null);

    // Join anatomy by rowId
    const anatomyIds = toStringArray(comp.anatomy);
    const anatomyParts: AnatomyPart[] = anatomyIds
      .map((id) => {
        const anatRow = anatomy.rows[id];
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
    const componentDecisionLog: DecisionLogEntry[] = decisionLogIds
      .map((id) => {
        const dlRow = decisionLog.rows[id];
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
          const blockRow = components.rows[blockId];
          if (!blockRow) {
            warnings.push(`[${comp.name}] Missing block rowId: ${blockId}`);
            return null;
          }
          const blockPropertyIds = toStringArray(blockRow.properties);
          const blockProps = blockPropertyIds
            .map((propId) => {
              const propRow = properties.rows[propId];
              if (!propRow) {
                warnings.push(
                  `[${comp.name}] Missing block property rowId: ${propId}`,
                );
                return null;
              }
              return transformProperty(propRow, propertyTypes.rows);
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

    // Resolve wiki-ref:// links in markdown content fields to final wiki paths.
    // This converts source-agnostic references (from coda-sync) into actual
    // wiki URLs like [Checkbox](/checkbox) for component cross-links.
    const rawMarkdownFields = {
      description: comp.description ?? "",
      usage: comp.usage ?? "",
      examples: comp.examples ?? "",
      interactions: comp.interactions ?? "",
    };

    const allRawTables: Record<string, { rows: Record<string, Record<string, unknown>> }> = {
      components: components,
      properties: properties,
      changelog: changelog,
      anatomy: anatomy,
      decisionLog: decisionLog,
      types: types,
      tiers: tiers,
      documentationStatuses: documentationStatuses,
      propertyTypes: propertyTypes,
      editors: editors,
    };

    const resolvedFields = syncConfig
      ? resolveAllWikiRefs(rawMarkdownFields, syncConfig, allRawTables)
      : rawMarkdownFields;

    // Build component
    const component: Component = {
      name: comp.name,
      slug,
      type: typeName as Component["type"],
      tiers: tierName as Component["tiers"],
      documentationStatus: docStatus as Component["documentationStatus"],
      lastEdited: comp.lastEdited ?? "",
      figmaLink: comp.figma ?? "",
      codeLink: comp.code ?? "",
      description: resolvedFields.description,
      usage: resolvedFields.usage,
      examples: resolvedFields.examples,
      interactions: resolvedFields.interactions,
      figmaComponentData: comp.figmaComponentData ?? "",
      componentExampleImage: resolveImage(comp.componentExampleImage),
      anatomy: anatomyObj,
      properties: componentProperties,
      childProperties,
      changeLog: componentChangelog,
      decisionLog: componentDecisionLog,
    };

    results.push(component);
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn(
      `\n⚠️  ${warnings.length} warning(s) during denormalization:`,
    );
    for (const w of warnings) {
      console.warn(`  ${w}`);
    }
  }

  return results;
}
