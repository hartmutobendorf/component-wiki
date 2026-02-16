import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Component } from "@wiki/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "../../../../data/agent");
const COMPONENTS_DIR = resolve(OUTPUT_DIR, "components");

const BASE_URL = "https://component.wiki";

/** Fields to strip from per-component detail files (binary/image data). */
const STRIP_FIELDS = new Set([
  "figmaComponentData",
  "componentExampleImage",
]);

/**
 * Strip binary/image fields from a component and add agent-specific fields.
 */
export function toAgentDetail(component: Component): Record<string, unknown> {
  const detail: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(component)) {
    if (STRIP_FIELDS.has(key)) continue;

    // Strip anatomy.image but keep anatomy.table
    if (key === "anatomy" && value) {
      const anatomy = value as { image?: string; table?: unknown[] };
      detail.anatomy = { table: anatomy.table ?? [] };
      continue;
    }

    detail[key] = value;
  }

  // Add url field
  detail.url = `${BASE_URL}/${component.slug}`;

  // Ensure mentionsComponents is included (attached by orchestrator)
  if (!("mentionsComponents" in detail)) {
    detail.mentionsComponents = [];
  }

  return detail;
}

/**
 * Build an index entry for a component.
 */
export function toIndexEntry(component: Component): Record<string, unknown> {
  return {
    name: component.name,
    slug: component.slug,
    type: component.type,
    tiers: component.tiers,
    description: component.description ?? "",
  };
}

export const agent = {
  name: "agent",

  build(components: Component[]): void {
    mkdirSync(COMPONENTS_DIR, { recursive: true });

    // Build and write per-component detail files
    for (const component of components) {
      const detail = toAgentDetail(component);
      const outputPath = resolve(COMPONENTS_DIR, `${component.slug}.json`);
      writeFileSync(outputPath, JSON.stringify(detail, null, 2) + "\n");
    }

    // Build and write index
    const types = [...new Set(components.map((c) => c.type))].sort();
    const tiers = [...new Set(components.map((c) => c.tiers))].sort();

    const index = {
      generatedAt: new Date().toISOString(),
      componentCount: components.length,
      types,
      tiers,
      components: components.map(toIndexEntry),
    };

    const indexPath = resolve(OUTPUT_DIR, "index.json");
    writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");

    console.log(
      `\n✅ [agent] Wrote ${components.length} detail files + index to data/agent/`
    );
  },
};
