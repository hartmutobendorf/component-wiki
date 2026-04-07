import { z } from "zod";

// ============================================================
// Raw schemas — validate coda-sync output (data/raw/*.json)
// ============================================================

const stringOrStringArray = z.union([z.string(), z.array(z.string())]);

// ── Construct ───────────────────────────────────────────────

export const rawConstructRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  type: z.string(),
  tier: z.string(),
  documentationStatus: z.string(),
  lastEdited: z.string(),
  description: z.string(),
  usage: z.string(),
  examples: z.string(),
  interactions: z.string(),
  figma: z.string(),
  code: z.string(),
  figmaComponentData: z.string(),
  componentExampleImage: stringOrStringArray,
  anatomyImage: stringOrStringArray,
  properties: z.array(z.string()),
  anatomy: z.array(z.string()),
  changeLog: z.array(z.string()),
  decisionLog: z.array(z.string()),
  uiBlocksUsedInPattern: stringOrStringArray,
  "sites-ArchitectureLevels": z.string(),
  appliedRule: z.array(z.string()),
  exceptionFromRule: z.array(z.string()),
}).passthrough();

// ── Construct Properties ────────────────────────────────────

export const rawConstructPropertyRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  required: z.boolean(),
  type: z.string(),
  description: z.string(),
  constraint: z.string(),
  options: z.string(),
  defaultOption: z.union([z.string(), z.boolean()]),
  component: z.array(z.string()),
}).passthrough();

// ── Construct Anatomy ───────────────────────────────────────

export const rawConstructAnatomyRowSchema = z.object({
  rowId: z.string(),
  number: z.coerce.number(),
  name: z.string(),
  description: z.string(),
  component: z.string(),
}).passthrough();

// ── Documentation Changelog ─────────────────────────────────

export const rawDocumentationChangelogRowSchema = z.object({
  rowId: z.string(),
  construct: z.string(),
  when: z.string(),
  what: z.string(),
  who: z.string(),
  concept: z.string(),
  rules: z.string(),
}).passthrough();

// ── Documentation Decisionlog ───────────────────────────────

export const rawDocumentationDecisionlogRowSchema = z.object({
  rowId: z.string(),
  construct: z.string(),
  where: z.string(),
  what: z.string(),
  link: z.string(),
  concept: z.string(),
  when: z.string(),
  rules: z.string(),
}).passthrough();

// ── Documentation Status ────────────────────────────────────

export const rawDocumentationStatusRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  components: z.array(z.string()),
  description: z.string(),
  concepts: z.array(z.string()),
}).passthrough();

// ── Construct Types ─────────────────────────────────────────

export const rawConstructTypeRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  components: z.array(z.string()),
  description: z.string(),
}).passthrough();

// ── Documentation Tiers ─────────────────────────────────────

export const rawDocumentationTierRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  components: z.array(z.string()),
  text: z.string(),
  concepts: z.array(z.string()),
}).passthrough();

// ── Documentation Editors ───────────────────────────────────

export const rawDocumentationEditorRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  changelog: z.array(z.string()),
}).passthrough();

// ── Construct Property Types ────────────────────────────────

export const rawConstructPropertyTypeRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  properties: z.array(z.string()),
  sitesPatternProperties: z.string(),
}).passthrough();

// ── Concepts ────────────────────────────────────────────────

export const rawConceptRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  type: z.string(),
  documentationStatus: z.string(),
  tier: z.string(),
  description: z.string(),
  content: z.string(),
  lastEdited: z.string(),
  decisionlog: z.array(z.string()),
  changelog: z.array(z.string()),
  appliedRule: z.array(z.string()),
  exceptedFromRule: z.array(z.string()),
}).passthrough();

// ── Rules ───────────────────────────────────────────────────

export const rawRuleRowSchema = z.object({
  rowId: z.string(),
  rule: z.string(),
  knownExceptionForThisConstruct: z.union([z.string(), z.array(z.string())]),
  appliesToTheseConcepts: z.union([z.string(), z.array(z.string())]),
  ruleStrength: z.union([z.string(), z.array(z.string())]),
  status: z.union([z.string(), z.array(z.string())]),
  type: z.union([z.string(), z.array(z.string())]),
  lastEdited: z.string(),
  changelog: z.union([z.string(), z.array(z.string())]),
  decisionlog: z.union([z.string(), z.array(z.string())]),
  appliesToTheseConstructs: z.union([z.string(), z.array(z.string())]),
  knownExceptionForThisConcept: z.union([z.string(), z.array(z.string())]),
}).passthrough();

// ── Concept Types ───────────────────────────────────────────

export const rawConceptTypeRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  concepts: z.array(z.string()),
  description: z.string(),
}).passthrough();

// ── Documentation Requirement Levels ────────────────────────

export const rawDocumentationRequirementLevelRowSchema = z.object({
  rowId: z.string(),
  keyWord: z.string(),
  description: z.string(),
  conceptRules: stringOrStringArray,
}).passthrough();

// ── Rule Status ─────────────────────────────────────────────

export const rawRuleStatusRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  description: z.string(),
  conceptRules: z.union([z.string(), z.array(z.string())]),
}).passthrough();

// ── Rule Types ──────────────────────────────────────────────

export const rawRuleTypeRowSchema = z.object({
  rowId: z.string(),
  ruleType: z.string(),
  description: z.string(),
  conceptRules: z.union([z.string(), z.array(z.string())]),
}).passthrough();

// ── Generic lookup (for simple name-only tables) ────────────

export const rawLookupRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
}).passthrough();

// ── Raw table wrapper ───────────────────────────────────────

/** Schema for a raw table file (data/raw/*.json) with typed rows */
function rawTableOf<T extends z.ZodTypeAny>(rowSchema: T) {
  return z.object({
    fetchedAt: z.string(),
    rows: z.record(z.string(), rowSchema),
  });
}

export const rawConstructTableSchema = rawTableOf(rawConstructRowSchema);
export const rawConstructPropertiesTableSchema = rawTableOf(rawConstructPropertyRowSchema);
export const rawConstructAnatomyTableSchema = rawTableOf(rawConstructAnatomyRowSchema);
export const rawDocumentationChangelogTableSchema = rawTableOf(rawDocumentationChangelogRowSchema);
export const rawDocumentationDecisionlogTableSchema = rawTableOf(rawDocumentationDecisionlogRowSchema);
export const rawDocumentationStatusTableSchema = rawTableOf(rawDocumentationStatusRowSchema);
export const rawConstructTypesTableSchema = rawTableOf(rawConstructTypeRowSchema);
export const rawDocumentationTiersTableSchema = rawTableOf(rawDocumentationTierRowSchema);
export const rawDocumentationEditorsTableSchema = rawTableOf(rawDocumentationEditorRowSchema);
export const rawConstructPropertyTypesTableSchema = rawTableOf(rawConstructPropertyTypeRowSchema);
export const rawConceptsTableSchema = rawTableOf(rawConceptRowSchema);
export const rawRulesTableSchema = rawTableOf(rawRuleRowSchema);
export const rawConceptTypesTableSchema = rawTableOf(rawConceptTypeRowSchema);
export const rawDocumentationRequirementLevelsTableSchema = rawTableOf(rawDocumentationRequirementLevelRowSchema);
export const rawRuleStatusTableSchema = rawTableOf(rawRuleStatusRowSchema);
export const rawRuleTypesTableSchema = rawTableOf(rawRuleTypeRowSchema);
export const rawLookupTableSchema = rawTableOf(rawLookupRowSchema);

// ============================================================
// Output schemas — validate transform output (data/wiki/*.json)
// ============================================================

export const propertySchema = z.object({
  name: z.string(),
  required: z.boolean().optional(),
  type: z.enum([
    "boolean",
    "string",
    "number",
    "single select",
    "multi select",
    "slot",
    "object",
    "callback",
  ]),
  description: z.string().optional().default(""),
  constraint: z.string().optional().default(""),
  options: z.array(z.string()).optional(),
  defaultOption: z.string().optional().default(""),
});

export const anatomyPartSchema = z.object({
  number: z.number(),
  name: z.string(),
  description: z.string(),
});

export const anatomySchema = z.object({
  image: z.string().optional().default(""),
  table: z.array(anatomyPartSchema).optional().default([]),
});

export const changeLogEntrySchema = z.object({
  who: z.string(),
  when: z.string(),
  what: z.string(),
});

export const decisionLogEntrySchema = z.object({
  where: z.string(),
  what: z.string(),
  link: z.string(),
  when: z.string(),
});

export const childPropertyGroupSchema = z.object({
  name: z.string(),
  properties: z.array(propertySchema),
});

export const mentionedInEntrySchema = z.object({
  name: z.string(),
  slug: z.string(),
  path: z.string(),
});

export const constructSchema = z.object({
  kind: z.literal("construct"),
  name: z.string(),
  slug: z.string(),
  type: z.enum([
    "Foundation",
    "Component",
    "Complex component",
    "Pattern",
    "Page",
    "Mental model",
    "Layout",
    "Block",
  ]),
  tier: z.enum(["Global", "Sites", "Apps"]),
  documentationStatus: z.enum([
    "All good",
    "Minimal",
    "Unclear",
    "Needs work",
  ]),
  lastEdited: z.string(),
  figmaLink: z.string().optional().default(""),
  codeLink: z.string().optional().default(""),
  description: z.string().optional().default(""),
  usage: z.string().optional().default(""),
  examples: z.string().optional().default(""),
  interactions: z.string().optional().default(""),
  figmaComponentData: z.string().optional().default(""),
  componentExampleImage: z.string().optional().default(""),
  sitesArchitectureLevels: z.string().optional().default(""),
  anatomy: anatomySchema.optional(),
  properties: z.array(propertySchema).optional().default([]),
  childProperties: z.array(childPropertyGroupSchema).optional(),
  changeLog: z.array(changeLogEntrySchema).optional().default([]),
  decisionLog: z.array(decisionLogEntrySchema).optional().default([]),
  appliedRules: z.array(z.lazy(() => ruleSchema)).optional().default([]),
  exceptionFromRules: z.array(z.lazy(() => ruleSchema)).optional().default([]),
  mentionedIn: z.array(mentionedInEntrySchema).optional().default([]),
});

export const conceptSchema = z.object({
  kind: z.literal("concept"),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  tier: z.string(),
  documentationStatus: z.string(),
  lastEdited: z.string(),
  description: z.string().optional().default(""),
  content: z.string().optional().default(""),
  changeLog: z.array(changeLogEntrySchema).optional().default([]),
  decisionLog: z.array(decisionLogEntrySchema).optional().default([]),
  appliedRules: z.array(z.lazy(() => ruleSchema)).optional().default([]),
  exceptedFromRules: z.array(z.lazy(() => ruleSchema)).optional().default([]),
  mentionedIn: z.array(mentionedInEntrySchema).optional().default([]),
  mentionsComponents: z.array(mentionedInEntrySchema).optional().default([]),
});

export const ruleSchema = z.object({
  rule: z.string(),
  ruleStrength: z.string().optional().default(""),
  status: z.string().optional().default(""),
  type: z.string().optional().default(""),
  lastEdited: z.string(),
  appliesToConcepts: z.array(z.string()).optional().default([]),
  appliesToConstructs: z.array(z.string()).optional().default([]),
  knownExceptionForConstructs: z.string().optional().default(""),
  knownExceptionForConcepts: z.string().optional().default(""),
  changeLog: z.array(changeLogEntrySchema).optional().default([]),
  decisionLog: z.array(decisionLogEntrySchema).optional().default([]),
});
