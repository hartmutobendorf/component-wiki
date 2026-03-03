import { buildConstructPath, buildConceptPath } from "./tiers";

/**
 * Ordering constants for navigation groups.
 * Groups appear in this order; types not listed here appear last.
 */
export const CONSTRUCT_TYPE_ORDER = [
  "Foundation",
  "Block",
  "Component",
  "Complex component",
  "Pattern",
  "Page",
  "Mental model",
] as const;

export const CONCEPT_TYPE_ORDER = [
  "Architecture",
  "Principle",
  "Decision guide",
] as const;

/** A single item in the navigation sidebar. */
export interface NavItem {
  name: string;
  slug: string;
  tier: string;
  type: string;
}

/** A group of navigation items under a type heading. */
export interface NavGroup {
  type: string;
  items: NavItem[];
}

/** A section of the navigation (e.g., "Concept" or "Construct"). */
export interface NavSection {
  heading: string;
  items: NavGroup[];
}

/** The complete navigation data structure passed to the side-navigation component. */
export interface NavData {
  sections: NavSection[];
}

/**
 * Minimal shape required from a construct collection entry.
 * Matches Astro's `getCollection("constructs")` entries.
 */
export interface ConstructEntry {
  id: string;
  data: {
    name: string;
    tiers: string;
    type: string;
  };
}

/**
 * Minimal shape required from a concept collection entry.
 * Matches Astro's `getCollection("concepts")` entries.
 */
export interface ConceptEntry {
  id: string;
  data: {
    name: string;
    tier: string;
    type: string;
  };
}

/**
 * Groups items by a key, returns a Record mapping key → items.
 */
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

/**
 * Builds ordered navigation groups from items using a type ordering.
 * Items within each group are sorted alphabetically by name.
 * Groups with no items are excluded.
 */
function buildOrderedGroups(
  items: NavItem[],
  typeOrder: readonly string[],
): NavGroup[] {
  const grouped = groupBy(items, (item) => item.type);

  return typeOrder
    .map((type) => ({
      type,
      items: (grouped[type] || []).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Builds the complete navigation data object for a given tier.
 *
 * This was previously inline logic in BaseLayout.astro frontmatter.
 * Extracted here so it can be unit tested independently.
 */
export function buildNavData(
  tier: string,
  constructs: ConstructEntry[],
  concepts: ConceptEntry[],
): NavData {
  // Filter to current tier
  const tierConstructs = constructs.filter((c) => c.data.tiers === tier);
  const tierConcepts = concepts.filter((c) => c.data.tier === tier);

  // Map to NavItem shape
  const constructItems: NavItem[] = tierConstructs.map((c) => ({
    name: c.data.name,
    slug: buildConstructPath(tier, c.id),
    tier: c.data.tiers,
    type: c.data.type,
  }));

  const conceptItems: NavItem[] = tierConcepts.map((c) => ({
    name: c.data.name,
    slug: buildConceptPath(tier, c.id),
    tier: c.data.tier,
    type: c.data.type,
  }));

  // Build ordered groups
  const constructNavItems = buildOrderedGroups(constructItems, CONSTRUCT_TYPE_ORDER);
  const conceptNavItems = buildOrderedGroups(conceptItems, CONCEPT_TYPE_ORDER);

  return {
    sections: [
      { heading: "Concept", items: conceptNavItems },
      { heading: "Construct", items: constructNavItems },
    ],
  };
}
