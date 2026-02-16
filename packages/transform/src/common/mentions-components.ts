/**
 * Build a "mentions components" reverse map from `mentionedIn` data.
 *
 * For each component, computes which other components reference it
 * in their docs. This is the reverse of `mentionedIn`: if component A
 * appears in component B's `mentionedIn`, then B appears in A's
 * `mentionsComponents`.
 *
 * This is computed once in the orchestrator and attached to each component
 * so any target can use it.
 */

import type { Component, MentionedInEntry } from "@wiki/shared";

/**
 * Build and attach `mentionsComponents` to all components.
 *
 * For each component, looks at all the slugs it links to (by scanning
 * which components list it in their `mentionedIn`) and builds the forward
 * map: this component mentions these other components.
 *
 * @returns The number of components that mention at least one other component.
 */
export function buildMentionsComponents(components: Component[]): number {
  // Build a map: for each component, which other components does it mention?
  // We derive this from mentionedIn: if B.mentionedIn includes A,
  // then A.mentionsComponents includes B.
  const mentionsMap = new Map<string, MentionedInEntry[]>();

  for (const component of components) {
    if (component.mentionedIn && component.mentionedIn.length > 0) {
      for (const entry of component.mentionedIn) {
        // entry.slug mentions component.slug
        if (!mentionsMap.has(entry.slug)) {
          mentionsMap.set(entry.slug, []);
        }
        mentionsMap.get(entry.slug)!.push({
          name: component.name,
          slug: component.slug,
        });
      }
    }
  }

  let count = 0;
  for (const component of components) {
    const mentions = mentionsMap.get(component.slug);
    if (mentions && mentions.length > 0) {
      (component as any).mentionsComponents = mentions.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      count++;
    } else {
      (component as any).mentionsComponents = [];
    }
  }

  return count;
}
