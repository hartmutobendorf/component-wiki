// ── Paths ───────────────────────────────────────────────────

export {
  TIERS,
  type Tier,
  type ItemKind,
  tierToPrefix,
  prefixToTier,
  buildPath,
  filterByTier,
} from "./paths.js";

// ── Output schemas ──────────────────────────────────────────

export {
  constructSchema,
  conceptSchema,
  ruleSchema,
  propertySchema,
  anatomyPartSchema,
  anatomySchema,
  changeLogEntrySchema,
  decisionLogEntrySchema,
  childPropertyGroupSchema,
  mentionedInEntrySchema,
} from "./schema.js";

// ── Raw row schemas ─────────────────────────────────────────

export {
  rawConstructRowSchema,
  rawConstructPropertyRowSchema,
  rawConstructAnatomyRowSchema,
  rawDocumentationChangelogRowSchema,
  rawDocumentationDecisionlogRowSchema,
  rawDocumentationStatusRowSchema,
  rawConstructTypeRowSchema,
  rawDocumentationTierRowSchema,
  rawDocumentationEditorRowSchema,
  rawConstructPropertyTypeRowSchema,
  rawConceptRowSchema,
  rawRuleRowSchema,
  rawConceptTypeRowSchema,
  rawDocumentationRequirementLevelRowSchema,
  rawRuleStatusRowSchema,
  rawRuleTypeRowSchema,
  rawLookupRowSchema,
} from "./schema.js";

// ── Raw table schemas ───────────────────────────────────────

export {
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
  rawLookupTableSchema,
} from "./schema.js";

// ── Output types ────────────────────────────────────────────

export type {
  Construct,
  Concept,
  Rule,
  Property,
  AnatomyPart,
  Anatomy,
  ChangeLogEntry,
  DecisionLogEntry,
  ChildPropertyGroup,
  MentionedInEntry,
} from "./types.js";

// ── Raw row types ───────────────────────────────────────────

export type {
  RawConstructRow,
  RawConstructPropertyRow,
  RawConstructAnatomyRow,
  RawDocumentationChangelogRow,
  RawDocumentationDecisionlogRow,
  RawDocumentationStatusRow,
  RawConstructTypeRow,
  RawDocumentationTierRow,
  RawDocumentationEditorRow,
  RawConstructPropertyTypeRow,
  RawConceptRow,
  RawRuleRow,
  RawConceptTypeRow,
  RawDocumentationRequirementLevelRow,
  RawRuleStatusRow,
  RawRuleTypeRow,
  RawLookupRow,
} from "./types.js";

// ── Raw table types ─────────────────────────────────────────

export type {
  RawConstructTable,
  RawConstructPropertiesTable,
  RawConstructAnatomyTable,
  RawDocumentationChangelogTable,
  RawDocumentationDecisionlogTable,
  RawDocumentationStatusTable,
  RawConstructTypesTable,
  RawDocumentationTiersTable,
  RawDocumentationEditorsTable,
  RawConstructPropertyTypesTable,
  RawConceptsTable,
  RawRulesTable,
  RawConceptTypesTable,
  RawDocumentationRequirementLevelsTable,
  RawRuleStatusTable,
  RawRuleTypesTable,
  RawLookupTable,
} from "./types.js";
