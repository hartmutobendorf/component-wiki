import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Construct, Concept } from "@wiki/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "../../../../data/agent");
const CONSTRUCTS_DIR = resolve(OUTPUT_DIR, "constructs");
const CONCEPTS_DIR = resolve(OUTPUT_DIR, "concepts");

const BASE_URL = "https://component.wiki";

/** Fields to strip from per-construct detail files (binary/image data). */
const STRIP_FIELDS = new Set([
  "figmaComponentData",
  "componentExampleImage",
]);

/**
 * Strip binary/image fields from a construct and add agent-specific fields.
 */
export function toAgentConstructDetail(construct: Construct): Record<string, unknown> {
  const detail: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(construct)) {
    if (STRIP_FIELDS.has(key)) continue;

    // Strip anatomy.image but keep anatomy.table
    if (key === "anatomy" && value) {
      const anatomy = value as { image?: string; table?: unknown[] };
      detail.anatomy = { table: anatomy.table ?? [] };
      continue;
    }

    detail[key] = value;
  }

  detail.url = `${BASE_URL}/${construct.slug}`;

  if (!("mentionsComponents" in detail)) {
    detail.mentionsComponents = [];
  }

  return detail;
}

/**
 * Build an agent detail for a concept.
 */
export function toAgentConceptDetail(concept: Concept): Record<string, unknown> {
  return {
    ...concept,
    url: `${BASE_URL}/${concept.slug}`,
  };
}

/**
 * Build an index entry for a construct.
 */
export function toConstructIndexEntry(construct: Construct): Record<string, unknown> {
  return {
    name: construct.name,
    slug: construct.slug,
    type: construct.type,
    tier: construct.tier,
    description: construct.description ?? "",
  };
}

/**
 * Build an index entry for a concept.
 */
export function toConceptIndexEntry(concept: Concept): Record<string, unknown> {
  return {
    name: concept.name,
    slug: concept.slug,
    type: concept.type,
    tier: concept.tier,
    description: concept.description ?? "",
  };
}

export const agent = {
  name: "agent",

  build(constructs: Construct[], concepts: Concept[]): void {
    // Clean and recreate output directories
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(CONSTRUCTS_DIR, { recursive: true });
    mkdirSync(CONCEPTS_DIR, { recursive: true });

    // Write per-construct detail files
    for (const construct of constructs) {
      const detail = toAgentConstructDetail(construct);
      const outputPath = resolve(CONSTRUCTS_DIR, `${construct.slug}.json`);
      writeFileSync(outputPath, JSON.stringify(detail, null, 2) + "\n");
    }

    // Write per-concept detail files
    for (const concept of concepts) {
      const detail = toAgentConceptDetail(concept);
      const outputPath = resolve(CONCEPTS_DIR, `${concept.slug}.json`);
      writeFileSync(outputPath, JSON.stringify(detail, null, 2) + "\n");
    }

    // Build and write index
    const constructTypes = [...new Set(constructs.map((c) => c.type))].sort();
    const constructTiers = [...new Set(constructs.map((c) => c.tier))].sort();
    const conceptTypes = [...new Set(concepts.map((c) => c.type))].sort();

    const index = {
      generatedAt: new Date().toISOString(),
      constructCount: constructs.length,
      conceptCount: concepts.length,
      constructTypes,
      constructTiers,
      conceptTypes,
      constructs: constructs.map(toConstructIndexEntry),
      concepts: concepts.map(toConceptIndexEntry),
    };

    const indexPath = resolve(OUTPUT_DIR, "index.json");
    writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");

    console.log(
      `\n✅ [agent] Wrote ${constructs.length} construct + ${concepts.length} concept detail files + index to data/agent/`
    );
  },
};
