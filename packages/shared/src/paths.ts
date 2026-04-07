/**
 * Canonical URL path-building for the component wiki.
 *
 * All packages must use these functions to construct wiki paths.
 * This ensures construct/concept/tier routing logic is defined once.
 */

export const TIERS = ["Global", "Apps", "Sites"] as const;
export type Tier = (typeof TIERS)[number];

export type ItemKind = "construct" | "concept";

/**
 * Returns the URL prefix for a given tier name.
 * e.g. "Global" → "global", "Apps" → "apps"
 */
export function tierToPrefix(tier: string): string {
  return tier.toLowerCase();
}

/**
 * Returns the tier name for a given URL prefix.
 * e.g. "global" → "Global", "apps" → "Apps"
 * Returns undefined if not a valid tier prefix.
 */
export function prefixToTier(prefix: string): Tier | undefined {
  return TIERS.find((t) => t.toLowerCase() === prefix.toLowerCase());
}

/**
 * Builds a URL path (without leading slash) for a construct or concept.
 *
 * e.g. ("Global", "construct", "button") → "global/construct/button"
 *      ("Sites",  "concept",   "color")  → "sites/concept/color"
 *
 * If tier is empty/missing, omits the prefix: "construct/{slug}" or "concept/{slug}".
 */
export function buildPath(tier: string, kind: ItemKind, slug: string): string {
  const prefix = tierToPrefix(tier);
  if (!prefix) return `${kind}/${slug}`;
  return `${prefix}/${kind}/${slug}`;
}

/**
 * Filters an array of constructs (or any objects with a `tiers` property)
 * to only include those matching the given tier.
 */
export function filterByTier<T extends { tier: string }>(
  items: T[],
  tier: string,
): T[] {
  return items.filter((item) => item.tier === tier);
}
