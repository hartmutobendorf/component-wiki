import { loadRawData } from "./common/raw-data.js";
import { denormalize } from "./common/denormalize.js";
import { buildMentionedIn } from "./common/mentioned-in.js";
import { buildMentionsComponents } from "./common/mentions-components.js";
import { wiki } from "./targets/wiki.js";
import { agent } from "./targets/agent.js";
import type { Component } from "@wiki/shared";

interface Target {
  name: string;
  build(components: Component[]): void;
}

const ALL_TARGETS: Target[] = [wiki, agent];

async function main() {
  console.log("📦 @wiki/transform — Denormalizing raw data...\n");

  // Parse --target flag
  const targetArg = process.argv.find((a) => a.startsWith("--target="))?.split("=")[1]
    ?? (process.argv.includes("--target") ? process.argv[process.argv.indexOf("--target") + 1] : undefined);

  const selectedTargets = targetArg
    ? ALL_TARGETS.filter((t) => t.name === targetArg)
    : ALL_TARGETS;

  if (targetArg && selectedTargets.length === 0) {
    console.error(`❌ Unknown target: "${targetArg}". Available: ${ALL_TARGETS.map((t) => t.name).join(", ")}`);
    process.exit(1);
  }

  // 1. Load raw data (once, shared)
  const { raw, syncConfig } = loadRawData();

  // 2. Denormalize (once, shared)
  const components = denormalize(raw, syncConfig);

  // 3. Build mentionedIn reverse index (once, shared)
  const mentionedInCount = buildMentionedIn(components);
  if (mentionedInCount > 0) {
    console.log(`  ${mentionedInCount} components have "mentioned in" references`);
  }

  // 4. Build mentionsComponents forward map (once, shared)
  const mentionsCount = buildMentionsComponents(components);
  if (mentionsCount > 0) {
    console.log(`  ${mentionsCount} components mention other components`);
  }

  // 5. Run selected targets
  for (const target of selectedTargets) {
    target.build(components);
  }

  // Summary
  const types = new Map<string, number>();
  for (const c of components) {
    types.set(c.type, (types.get(c.type) ?? 0) + 1);
  }
  console.log("\n📊 Summary by type:");
  for (const [type, count] of [...types.entries()].sort()) {
    console.log(`  ${type}: ${count}`);
  }
}

main().catch((err) => {
  console.error("Transform failed:", err);
  process.exit(1);
});
