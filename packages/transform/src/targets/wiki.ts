import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { constructSchema, conceptSchema } from "@wiki/shared";
import type { Construct, Concept } from "@wiki/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "../../../../data/wiki");
const CONSTRUCTS_DIR = resolve(OUTPUT_DIR, "constructs");
const CONCEPTS_DIR = resolve(OUTPUT_DIR, "concepts");

export const wiki = {
  name: "wiki",

  build(constructs: Construct[], concepts: Concept[]): void {
    // Clean and recreate output directories
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(CONSTRUCTS_DIR, { recursive: true });
    mkdirSync(CONCEPTS_DIR, { recursive: true });

    let validCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Write constructs
    for (const construct of constructs) {
      const result = constructSchema.safeParse(construct);
      if (!result.success) {
        errorCount++;
        const issues = result.error.issues
          .map((i) => `    ${i.path.join(".")}: ${i.message}`)
          .join("\n");
        errors.push(`  ❌ [construct] ${construct.name} (${construct.slug}):\n${issues}`);
      }

      const outputPath = resolve(CONSTRUCTS_DIR, `${construct.slug}.json`);
      writeFileSync(outputPath, JSON.stringify(construct, null, 2) + "\n");
      validCount++;
    }

    // Write concepts
    for (const concept of concepts) {
      const result = conceptSchema.safeParse(concept);
      if (!result.success) {
        errorCount++;
        const issues = result.error.issues
          .map((i) => `    ${i.path.join(".")}: ${i.message}`)
          .join("\n");
        errors.push(`  ❌ [concept] ${concept.name} (${concept.slug}):\n${issues}`);
      }

      const outputPath = resolve(CONCEPTS_DIR, `${concept.slug}.json`);
      writeFileSync(outputPath, JSON.stringify(concept, null, 2) + "\n");
      validCount++;
    }

    console.log(`\n✅ [wiki] Wrote ${constructs.length} construct files to data/wiki/constructs/`);
    console.log(`✅ [wiki] Wrote ${concepts.length} concept files to data/wiki/concepts/`);

    if (errorCount > 0) {
      console.error(`\n⚠️  ${errorCount} output validation error(s):`);
      for (const e of errors) {
        console.error(e);
      }
    }
  },
};
