import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { constructSchema } from "@wiki/shared";

const constructs = defineCollection({
  loader: glob({
    pattern: "*.json",
    base: "../../data/wiki/constructs",
  }),
  schema: constructSchema,
});

export const collections = { constructs };
