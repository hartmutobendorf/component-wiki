export const TIERS = ["Global", "Apps", "Sites"] as const;
export type Tier = (typeof TIERS)[number];

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
 * Builds a construct URL path given a tier and construct slug.
 * e.g. ("Global", "button") → "global/button"
 */
export function buildConstructPath(tier: string, slug: string): string {
  return `${tierToPrefix(tier)}/${slug}`;
}

/**
 * Builds a concept URL path given a tier and concept slug.
 * e.g. ("Global", "color") → "global/concept/color"
 */
export function buildConceptPath(tier: string, slug: string): string {
  return `${tierToPrefix(tier)}/concept/${slug}`;
}

/**
 * Filters an array of constructs (or any objects with a `tiers` property)
 * to only include those matching the given tier.
 */
export function filterByTier<T extends { tiers: string }>(
  items: T[],
  tier: string,
): T[] {
  return items.filter((item) => item.tiers === tier);
}
