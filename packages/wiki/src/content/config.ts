import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { constructSchema, conceptSchema } from "@wiki/shared";

const constructs = defineCollection({
  loader: glob({
    pattern: "*.json",
    base: "../../data/wiki/constructs",
  }),
  schema: constructSchema,
});

const concepts = defineCollection({
  loader: glob({
    pattern: "*.json",
    base: "../../data/wiki/concepts",
  }),
  schema: conceptSchema,
});

export const collections = { constructs, concepts };
