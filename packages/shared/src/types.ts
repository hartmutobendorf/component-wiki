import type { z } from "zod";
import type {
  // Output schemas
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
  // Raw row schemas
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
  // Raw table schemas
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

// ── Output types (transform → wiki) ─────────────────────────

export type Construct = z.infer<typeof constructSchema>;
export type Concept = z.infer<typeof conceptSchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type Property = z.infer<typeof propertySchema>;
export type AnatomyPart = z.infer<typeof anatomyPartSchema>;
export type Anatomy = z.infer<typeof anatomySchema>;
export type ChangeLogEntry = z.infer<typeof changeLogEntrySchema>;
export type DecisionLogEntry = z.infer<typeof decisionLogEntrySchema>;
export type ChildPropertyGroup = z.infer<typeof childPropertyGroupSchema>;
export type MentionedInEntry = z.infer<typeof mentionedInEntrySchema>;

// ── Raw row types (coda-sync output) ────────────────────────

export type RawConstructRow = z.infer<typeof rawConstructRowSchema>;
export type RawConstructPropertyRow = z.infer<typeof rawConstructPropertyRowSchema>;
export type RawConstructAnatomyRow = z.infer<typeof rawConstructAnatomyRowSchema>;
export type RawDocumentationChangelogRow = z.infer<typeof rawDocumentationChangelogRowSchema>;
export type RawDocumentationDecisionlogRow = z.infer<typeof rawDocumentationDecisionlogRowSchema>;
export type RawDocumentationStatusRow = z.infer<typeof rawDocumentationStatusRowSchema>;
export type RawConstructTypeRow = z.infer<typeof rawConstructTypeRowSchema>;
export type RawDocumentationTierRow = z.infer<typeof rawDocumentationTierRowSchema>;
export type RawDocumentationEditorRow = z.infer<typeof rawDocumentationEditorRowSchema>;
export type RawConstructPropertyTypeRow = z.infer<typeof rawConstructPropertyTypeRowSchema>;
export type RawConceptRow = z.infer<typeof rawConceptRowSchema>;
export type RawRuleRow = z.infer<typeof rawRuleRowSchema>;
export type RawConceptTypeRow = z.infer<typeof rawConceptTypeRowSchema>;
export type RawDocumentationRequirementLevelRow = z.infer<typeof rawDocumentationRequirementLevelRowSchema>;
export type RawRuleStatusRow = z.infer<typeof rawRuleStatusRowSchema>;
export type RawRuleTypeRow = z.infer<typeof rawRuleTypeRowSchema>;
export type RawLookupRow = z.infer<typeof rawLookupRowSchema>;

// ── Raw table types (full file structure) ───────────────────

export type RawConstructTable = z.infer<typeof rawConstructTableSchema>;
export type RawConstructPropertiesTable = z.infer<typeof rawConstructPropertiesTableSchema>;
export type RawConstructAnatomyTable = z.infer<typeof rawConstructAnatomyTableSchema>;
export type RawDocumentationChangelogTable = z.infer<typeof rawDocumentationChangelogTableSchema>;
export type RawDocumentationDecisionlogTable = z.infer<typeof rawDocumentationDecisionlogTableSchema>;
export type RawDocumentationStatusTable = z.infer<typeof rawDocumentationStatusTableSchema>;
export type RawConstructTypesTable = z.infer<typeof rawConstructTypesTableSchema>;
export type RawDocumentationTiersTable = z.infer<typeof rawDocumentationTiersTableSchema>;
export type RawDocumentationEditorsTable = z.infer<typeof rawDocumentationEditorsTableSchema>;
export type RawConstructPropertyTypesTable = z.infer<typeof rawConstructPropertyTypesTableSchema>;
export type RawConceptsTable = z.infer<typeof rawConceptsTableSchema>;
export type RawRulesTable = z.infer<typeof rawRulesTableSchema>;
export type RawConceptTypesTable = z.infer<typeof rawConceptTypesTableSchema>;
export type RawDocumentationRequirementLevelsTable = z.infer<typeof rawDocumentationRequirementLevelsTableSchema>;
export type RawRuleStatusTable = z.infer<typeof rawRuleStatusTableSchema>;
export type RawRuleTypesTable = z.infer<typeof rawRuleTypesTableSchema>;
export type RawLookupTable = z.infer<typeof rawLookupTableSchema>;
