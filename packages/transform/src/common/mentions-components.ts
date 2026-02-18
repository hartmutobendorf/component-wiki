/**
 * Build a "mentions" forward map from `mentionedIn` data.
 *
 * For each item, computes which other items reference it
 * in their docs. This is the reverse of `mentionedIn`.
 */

import type { MentionedInEntry } from "@wiki/shared";

interface Mentionable {
  name: string;
  slug: string;
  mentionedIn: MentionedInEntry[];
}

/**
 * Build and attach `mentionsComponents` to all items.
 *
 * @returns The number of items that mention at least one other item.
 */
export function buildMentionsComponents(items: Mentionable[]): number {
  const mentionsMap = new Map<string, MentionedInEntry[]>();

  for (const item of items) {
    if (item.mentionedIn && item.mentionedIn.length > 0) {
      for (const entry of item.mentionedIn) {
        if (!mentionsMap.has(entry.slug)) {
          mentionsMap.set(entry.slug, []);
        }
        mentionsMap.get(entry.slug)!.push({
          name: item.name,
          slug: item.slug,
        });
      }
    }
  }

  let count = 0;
  for (const item of items) {
    const mentions = mentionsMap.get(item.slug);
    if (mentions && mentions.length > 0) {
      (item as any).mentionsComponents = mentions.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      count++;
    } else {
      (item as any).mentionsComponents = [];
    }
  }

  return count;
}
