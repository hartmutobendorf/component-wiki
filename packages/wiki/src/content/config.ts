import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { componentSchema } from "@wiki/shared";

const components = defineCollection({
  loader: glob({
    pattern: "*.json",
    base: "../../data/components",
  }),
  schema: componentSchema,
});

export const collections = { components };
