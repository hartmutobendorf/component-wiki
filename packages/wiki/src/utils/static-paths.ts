import { getCollection } from "astro:content";
import { TIERS } from "./tiers";

/**
 * Builds static paths for construct routes.
 * Shared by [tier]/[slug].astro, [tier]/[slug].json.ts, and [tier]/[slug].md.ts.
 */
export async function getConstructPaths() {
  const constructs = await getCollection("constructs");

  return TIERS.flatMap((tier) => {
    const prefix = tier.toLowerCase();
    return constructs
      .filter((construct) => construct.data.tiers === tier)
      .map((construct) => ({
        params: { tier: prefix, slug: construct.id },
        props: { constructId: construct.id, activeTier: tier },
      }));
  });
}

/**
 * Builds static paths for concept routes.
 * Shared by [tier]/concept/[slug].astro, [tier]/concept/[slug].json.ts,
 * and [tier]/concept/[slug].md.ts.
 */
export async function getConceptPaths() {
  const concepts = await getCollection("concepts");

  return TIERS.flatMap((tier) => {
    const prefix = tier.toLowerCase();
    return concepts
      .filter((concept) => concept.data.tier === tier)
      .map((concept) => ({
        params: { tier: prefix, slug: concept.id },
        props: { conceptId: concept.id, activeTier: tier },
      }));
  });
}
