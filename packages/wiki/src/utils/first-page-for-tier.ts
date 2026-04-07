import { buildPath } from "@wiki/shared";
import { CONCEPT_TYPE_ORDER } from "./nav-data";

/**
 * Minimal shapes expected from collection entries.
 * Matches Astro's `getCollection("concepts")` and `getCollection("constructs")`.
 */
interface ConceptLike {
  id: string;
  data: { name: string; tier: string; type: string };
}

interface ConstructLike {
  id: string;
  data: { name: string; tier: string };
}

/**
 * Returns the URL path for the first page to navigate to for a given tier.
 *
 * Order of preference:
 * 1. First concept matching CONCEPT_TYPE_ORDER (alphabetical within type)
 * 2. First construct (alphabetical)
 *
 * Shared by TopNavigation.astro and [tier]/index.astro.
 */
export function getFirstPageForTier(
  tier: string,
  allConcepts: ConceptLike[],
  allConstructs: ConstructLike[],
): string {
  const concepts = allConcepts
    .filter((c) => c.data.tier === tier)
    .sort((a, b) => a.data.name.localeCompare(b.data.name));

  const first =
    CONCEPT_TYPE_ORDER.reduce<ConceptLike | null>(
      (found, type) =>
        found ?? concepts.find((c) => c.data.type === type) ?? null,
      null,
    ) ?? concepts[0];

  if (first) {
    return `/${buildPath(tier, "concept", first.id)}`;
  }

  const constructs = allConstructs
    .filter((c) => c.data.tier === tier)
    .sort((a, b) => a.data.name.localeCompare(b.data.name));

  return `/${buildPath(tier, "construct", constructs[0]?.id ?? "")}`;
}
