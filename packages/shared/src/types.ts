import type { z } from "zod";
import type {
  // Output schemas
  componentSchema,
  propertySchema,
  anatomyPartSchema,
  anatomySchema,
  changeLogEntrySchema,
  decisionLogEntrySchema,
  childPropertyGroupSchema,
  // Raw row schemas
  rawComponentRowSchema,
  rawPropertyRowSchema,
  rawAnatomyRowSchema,
  rawChangeLogRowSchema,
  rawDecisionLogRowSchema,
  rawLookupRowSchema,
  // Raw table schemas
  rawComponentsTableSchema,
  rawPropertiesTableSchema,
  rawAnatomyTableSchema,
  rawChangeLogTableSchema,
  rawDecisionLogTableSchema,
  rawLookupTableSchema,
} from "./schema.js";

// Output types (transform → wiki)
export type Component = z.infer<typeof componentSchema>;
export type Property = z.infer<typeof propertySchema>;
export type AnatomyPart = z.infer<typeof anatomyPartSchema>;
export type Anatomy = z.infer<typeof anatomySchema>;
export type ChangeLogEntry = z.infer<typeof changeLogEntrySchema>;
export type DecisionLogEntry = z.infer<typeof decisionLogEntrySchema>;
export type ChildPropertyGroup = z.infer<typeof childPropertyGroupSchema>;

// Raw row types (coda-sync output)
export type RawComponentRow = z.infer<typeof rawComponentRowSchema>;
export type RawPropertyRow = z.infer<typeof rawPropertyRowSchema>;
export type RawAnatomyRow = z.infer<typeof rawAnatomyRowSchema>;
export type RawChangeLogRow = z.infer<typeof rawChangeLogRowSchema>;
export type RawDecisionLogRow = z.infer<typeof rawDecisionLogRowSchema>;
export type RawLookupRow = z.infer<typeof rawLookupRowSchema>;

// Raw table types (full file structure)
export type RawComponentsTable = z.infer<typeof rawComponentsTableSchema>;
export type RawPropertiesTable = z.infer<typeof rawPropertiesTableSchema>;
export type RawAnatomyTable = z.infer<typeof rawAnatomyTableSchema>;
export type RawChangeLogTable = z.infer<typeof rawChangeLogTableSchema>;
export type RawDecisionLogTable = z.infer<typeof rawDecisionLogTableSchema>;
export type RawLookupTable = z.infer<typeof rawLookupTableSchema>;
