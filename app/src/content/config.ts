import { defineCollection, z } from 'astro:content';

// Define the components metadata collection
// Each component folder will have a meta.json file with this structure
const componentsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    type: z.enum(['Component', 'Complex component', 'Pattern', 'Mental model']),
    tiers: z.enum(['Global', 'Sites', 'Apps']),
    documentationStatus: z.enum(['All good', 'Minimal', 'Unclear', 'Needs work']),
    lastEdited: z.string(),
    figmaLink: z.string().url().optional().or(z.literal('')),
    codeLink: z.string().url().optional().or(z.literal('')),
    figmaComponentDataPath: z.string().optional().or(z.literal('')),
    componentExampleImage: z.string().optional().or(z.literal('')),
    changeLog: z.array(z.object({
      who: z.string(),
      when: z.string(),
      what: z.string(),
    })).optional().default([]),
  }),
});

export const collections = {
  components: componentsCollection,
};
