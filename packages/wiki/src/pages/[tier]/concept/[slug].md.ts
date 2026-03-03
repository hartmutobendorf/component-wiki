import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";
import { TIERS } from "../../../utils/tiers";
import { generateConceptMarkdown } from "../../../utils/generate-concept-markdown";

export const getStaticPaths: GetStaticPaths = async () => {
  const concepts = await getCollection("concepts");

  return TIERS.flatMap((tier) => {
    const prefix = tier.toLowerCase();
    return concepts
      .filter((c) => c.data.tier === tier)
      .map((c) => ({ params: { tier: prefix, slug: c.id } }));
  });
};

export const GET: APIRoute = async ({ params }) => {
  const concept = await getEntry("concepts", params.slug!);
  if (!concept) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(generateConceptMarkdown(concept.data), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
