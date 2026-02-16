import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { componentSchema } from "@wiki/shared";
import type { Component } from "@wiki/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "../../../../data/wiki");

export const wiki = {
  name: "wiki",

  build(components: Component[]): void {
    mkdirSync(OUTPUT_DIR, { recursive: true });

    let validCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const component of components) {
      const result = componentSchema.safeParse(component);
      if (!result.success) {
        errorCount++;
        const issues = result.error.issues
          .map((i) => `    ${i.path.join(".")}: ${i.message}`)
          .join("\n");
        errors.push(`  ❌ ${component.name} (${component.slug}):\n${issues}`);
      }

      const outputPath = resolve(OUTPUT_DIR, `${component.slug}.json`);
      writeFileSync(outputPath, JSON.stringify(component, null, 2) + "\n");
      validCount++;
    }

    console.log(`\n✅ [wiki] Wrote ${validCount} component files to data/wiki/`);

    if (errorCount > 0) {
      console.error(`\n⚠️  ${errorCount} output validation error(s):`);
      for (const e of errors) {
        console.error(e);
      }
    }
  },
};
