import { defineCollection, z } from "astro:content";

// Define the components metadata collection
// Each component folder will have a meta.json file with this structure
const componentsCollection = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    type: z.enum([
      "Foundation",
      "Component",
      "Complex component",
      "Pattern",
      "Page",
      "Mental model",
    ]),
    tiers: z.enum(["Global", "Sites", "Apps"]),
    documentationStatus: z.enum([
      "All good",
      "Minimal",
      "Unclear",
      "Needs work",
    ]),
    lastEdited: z.string(),
    figmaLink: z.string().url().optional().or(z.literal("")),
    codeLink: z.string().url().optional().or(z.literal("")),
    figmaComponentDataPath: z.string().optional().or(z.literal("")),
    componentExampleImage: z.string().optional().or(z.literal("")),
    changeLog: z
      .array(
        z.object({
          who: z.string(),
          when: z.string(),
          what: z.string(),
        }),
      )
      .optional()
      .default([]),
    properties: z
      .array(
        z.object({
          name: z.string(),
          required: z.boolean().optional(),
          type: z.enum([
            "boolean",
            "string",
            "number",
            "single select",
            "multi select",
            "slot",
          ]),
          description: z.string().optional(),
          constraint: z.string().optional(),
          options: z.array(z.string()).optional(),
          defaultOption: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
  }),
});

export const collections = {
  components: componentsCollection,
};
