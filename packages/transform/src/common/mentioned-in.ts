/**
 * Build a "mentioned in" reverse index for constructs and concepts.
 *
 * Scans all resolved markdown content fields for internal links
 * (e.g., [Checkbox](/global/checkbox)) and builds a map of which items
 * are mentioned by which other items.
 */

import { buildPath } from "@wiki/shared";
import type { ItemKind, MentionedInEntry } from "@wiki/shared";

/** Item with a slug and markdown fields that can be scanned for mentions. */
interface Mentionable {
  kind: ItemKind;
  name: string;
  slug: string;
  tier: string;
  description?: string;
  usage?: string;
  examples?: string;
  interactions?: string;
  content?: string;
  mentionedIn: MentionedInEntry[];
}

/**
 * Regex matching internal wiki links:
 * - Construct links: [text](/{tier}/construct/{slug}) or [text](/{tier}/construct/{slug}#section)
 * - Concept links:   [text](/{tier}/concept/{slug}) or [text](/{tier}/concept/{slug}#section)
 */
const INTERNAL_LINK_REGEX =
  /\[([^\]]*)\]\(\/((?:[a-z0-9-]+\/)?(?:construct|concept)\/[a-z0-9-]+(?:#[a-z0-9-]+)?)\)/g;

/**
 * Extract the slug from an internal link path.
 * Handles paths like "global/construct/button", "global/concept/color".
 * Strips tier prefix, construct/concept segment, and section anchor.
 */
function extractSlugFromPath(path: string): string {
  const withoutAnchor = path.split("#")[0];
  const parts = withoutAnchor.split("/");
  return parts[parts.length - 1];
}

/**
 * Extract all unique internal slugs linked from an item's markdown fields.
 * Self-references are excluded. Section anchors are stripped.
 */
export function extractMentionedSlugs(item: Mentionable): Set<string> {
  const slugs = new Set<string>();
  const fieldsToScan = [
    item.description,
    item.usage,
    item.examples,
    item.interactions,
    item.content,
  ];

  for (const field of fieldsToScan) {
    if (!field) continue;
    INTERNAL_LINK_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = INTERNAL_LINK_REGEX.exec(field)) !== null) {
      const slug = extractSlugFromPath(match[2]);
      if (slug && slug !== item.slug) {
        slugs.add(slug);
      }
    }
  }

  return slugs;
}

/**
 * Build and attach `mentionedIn` arrays to all items.
 *
 * @returns The number of items that have at least one mention.
 */
export function buildMentionedIn(items: Mentionable[]): number {
  // Pre-compute wiki paths for all items
  const pathBySlug = new Map<string, string>();
  for (const item of items) {
    pathBySlug.set(item.slug, buildPath(item.tier, item.kind, item.slug));
  }

  const mentionedInMap = new Map<string, MentionedInEntry[]>();

  for (const item of items) {
    const mentionedSlugs = extractMentionedSlugs(item);
    const itemPath = pathBySlug.get(item.slug) ?? item.slug;

    for (const slug of mentionedSlugs) {
      if (!mentionedInMap.has(slug)) {
        mentionedInMap.set(slug, []);
      }
      mentionedInMap.get(slug)!.push({
        name: item.name,
        slug: item.slug,
        path: itemPath,
      });
    }
  }

  let count = 0;
  for (const item of items) {
    const mentions = mentionedInMap.get(item.slug);
    if (mentions && mentions.length > 0) {
      item.mentionedIn = mentions.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      count++;
    }
  }

  return count;
}
