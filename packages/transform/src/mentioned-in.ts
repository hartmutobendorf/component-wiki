/**
 * Build a "mentioned in" reverse index for components.
 *
 * Scans all resolved markdown content fields (description, usage, examples)
 * for internal links (e.g., [Checkbox](/checkbox)) and builds a map of
 * which components are mentioned by which other components.
 *
 * This enables a "Mentioned in" section on each component page, showing
 * other components that reference it in their documentation.
 */

import type { Component, MentionedInEntry } from "@wiki/shared";

/**
 * Regex matching internal wiki links: [text](/slug) or [text](/slug#section)
 * Captures: [1] = link text, [2] = slug (possibly with #anchor)
 */
const INTERNAL_LINK_REGEX =
  /\[([^\]]*)\]\(\/([a-z0-9-]+(?:#[a-z0-9-]+)?)\)/g;

/**
 * Extract all unique internal slugs linked from a component's markdown fields.
 * Self-references (links to the component's own slug) are excluded.
 * Section anchors (e.g., #properties) are stripped to get the base slug.
 */
export function extractMentionedSlugs(component: Component): Set<string> {
  const slugs = new Set<string>();
  const fieldsToScan = [
    component.description,
    component.usage,
    component.examples,
    component.interactions,
  ];

  for (const field of fieldsToScan) {
    if (!field) continue;
    INTERNAL_LINK_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = INTERNAL_LINK_REGEX.exec(field)) !== null) {
      const slug = match[2].split("#")[0];
      if (slug && slug !== component.slug) {
        slugs.add(slug);
      }
    }
  }

  return slugs;
}

/**
 * Build and attach `mentionedIn` arrays to all components.
 *
 * For each component, scans its markdown fields for internal links to other
 * components. Builds a reverse index (target slug → list of source components)
 * and attaches it as the `mentionedIn` field, sorted alphabetically by name.
 *
 * @returns The number of components that have at least one mention.
 */
export function buildMentionedIn(components: Component[]): number {
  const mentionedInMap = new Map<string, MentionedInEntry[]>();

  for (const component of components) {
    const mentionedSlugs = extractMentionedSlugs(component);

    for (const slug of mentionedSlugs) {
      if (!mentionedInMap.has(slug)) {
        mentionedInMap.set(slug, []);
      }
      mentionedInMap.get(slug)!.push({
        name: component.name,
        slug: component.slug,
      });
    }
  }

  let count = 0;
  for (const component of components) {
    const mentions = mentionedInMap.get(component.slug);
    if (mentions && mentions.length > 0) {
      component.mentionedIn = mentions.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      count++;
    }
  }

  return count;
}
