/**
 * Build a "mentioned in" reverse index for constructs and concepts.
 *
 * Scans all resolved markdown content fields for internal links
 * (e.g., [Checkbox](/checkbox)) and builds a map of which items
 * are mentioned by which other items.
 */

import type { Construct, Concept, MentionedInEntry } from "@wiki/shared";

/** Item with a slug and markdown fields that can be scanned for mentions. */
interface Mentionable {
  name: string;
  slug: string;
  description?: string;
  usage?: string;
  examples?: string;
  interactions?: string;
  content?: string;
  mentionedIn: MentionedInEntry[];
}

/**
 * Regex matching internal wiki links: [text](/slug) or [text](/slug#section)
 */
const INTERNAL_LINK_REGEX =
  /\[([^\]]*)\]\(\/([a-z0-9-]+(?:#[a-z0-9-]+)?)\)/g;

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
      const slug = match[2].split("#")[0];
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
  const mentionedInMap = new Map<string, MentionedInEntry[]>();

  for (const item of items) {
    const mentionedSlugs = extractMentionedSlugs(item);

    for (const slug of mentionedSlugs) {
      if (!mentionedInMap.has(slug)) {
        mentionedInMap.set(slug, []);
      }
      mentionedInMap.get(slug)!.push({
        name: item.name,
        slug: item.slug,
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
