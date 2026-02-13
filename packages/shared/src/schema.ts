import { z } from "zod";

// ============================================================
// Raw schemas — validate coda-sync output (data/raw/*.json)
// ============================================================

const stringOrStringArray = z.union([z.string(), z.array(z.string())]);

export const rawComponentRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  type: z.string(),
  tiers: z.string(),
  documentationStatus: z.string(),
  lastEdited: z.string(),
  description: z.string(),
  usage: z.string(),
  examples: z.string(),
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
}).passthrough();

export const rawPropertyRowSchema = z.object({
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

export const rawAnatomyRowSchema = z.object({
  rowId: z.string(),
  number: z.coerce.number(),
  name: z.string(),
  description: z.string(),
  component: z.string(),
}).passthrough();

export const rawChangeLogRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
  when: z.string(),
  what: z.string(),
  who: z.string(),
}).passthrough();

export const rawDecisionLogRowSchema = z.object({
  rowId: z.string(),
  component: z.string(),
  where: z.string(),
  decisionMade: z.string(),
  link: z.string(),
}).passthrough();

export const rawLookupRowSchema = z.object({
  rowId: z.string(),
  name: z.string(),
}).passthrough();

/** Schema for a raw table file (data/raw/*.json) with typed rows */
function rawTableOf<T extends z.ZodTypeAny>(rowSchema: T) {
  return z.object({
    fetchedAt: z.string(),
    rows: z.record(z.string(), rowSchema),
  });
}

export const rawComponentsTableSchema = rawTableOf(rawComponentRowSchema);
export const rawPropertiesTableSchema = rawTableOf(rawPropertyRowSchema);
export const rawAnatomyTableSchema = rawTableOf(rawAnatomyRowSchema);
export const rawChangeLogTableSchema = rawTableOf(rawChangeLogRowSchema);
export const rawDecisionLogTableSchema = rawTableOf(rawDecisionLogRowSchema);
export const rawLookupTableSchema = rawTableOf(rawLookupRowSchema);

// ============================================================
// Output schemas — validate transform output (data/components/*.json)
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
  decisionMade: z.string(),
  link: z.string(),
});

export const childPropertyGroupSchema = z.object({
  name: z.string(),
  properties: z.array(propertySchema),
});

export const mentionedInEntrySchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const componentSchema = z.object({
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
  ]),
  tiers: z.enum(["Global", "Sites", "Apps"]),
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
  figmaComponentData: z.string().optional().default(""),
  componentExampleImage: z.string().optional().default(""),
  anatomy: anatomySchema.optional(),
  properties: z.array(propertySchema).optional().default([]),
  childProperties: z.array(childPropertyGroupSchema).optional(),
  changeLog: z.array(changeLogEntrySchema).optional().default([]),
  decisionLog: z.array(decisionLogEntrySchema).optional().default([]),
  mentionedIn: z.array(mentionedInEntrySchema).optional().default([]),
});
