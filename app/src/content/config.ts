import { defineCollection, z } from 'astro:content';

// Define the components metadata collection
// Each component folder will have a meta.json file with this structure
const componentsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    type: z.enum(['Component', 'Complex component']),
    documentationStatus: z.enum(['Minimal', 'Needs work', 'Complete']),
    lastEdited: z.string(),
    figmaLink: z.string().url().optional().or(z.literal('')),
    codeLink: z.string().url().optional().or(z.literal('')),
  }),
});

export const collections = {
  components: componentsCollection,
};
