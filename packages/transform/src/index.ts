import { loadRawData } from "./common/raw-data.js";
import { denormalizeConstructs, denormalizeConcepts } from "./common/denormalize.js";
import { buildMentionedIn } from "./common/mentioned-in.js";
import { buildMentionsComponents } from "./common/mentions-components.js";
import { wiki } from "./targets/wiki.js";
import { agent } from "./targets/agent.js";
import type { Construct, Concept } from "@wiki/shared";

interface Target {
  name: string;
  build(constructs: Construct[], concepts: Concept[]): void;
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
  const constructs = denormalizeConstructs(raw, syncConfig);
  const concepts = denormalizeConcepts(raw, syncConfig);

  console.log(`  ${constructs.length} constructs, ${concepts.length} concepts denormalized`);

  // 3. Build mentionedIn reverse index (across both constructs and concepts)
  const allItems = [...constructs, ...concepts];
  const mentionedInCount = buildMentionedIn(allItems);
  if (mentionedInCount > 0) {
    console.log(`  ${mentionedInCount} items have "mentioned in" references`);
  }

  // 4. Build mentionsComponents forward map
  const mentionsCount = buildMentionsComponents(allItems);
  if (mentionsCount > 0) {
    console.log(`  ${mentionsCount} items mention other items`);
  }

  // 5. Run selected targets
  for (const target of selectedTargets) {
    target.build(constructs, concepts);
  }

  // Summary
  const types = new Map<string, number>();
  for (const c of constructs) {
    types.set(c.type, (types.get(c.type) ?? 0) + 1);
  }
  console.log("\n📊 Summary — Constructs by type:");
  for (const [type, count] of [...types.entries()].sort()) {
    console.log(`  ${type}: ${count}`);
  }

  const conceptTypeMap = new Map<string, number>();
  for (const c of concepts) {
    conceptTypeMap.set(c.type, (conceptTypeMap.get(c.type) ?? 0) + 1);
  }
  if (conceptTypeMap.size > 0) {
    console.log("\n📊 Summary — Concepts by type:");
    for (const [type, count] of [...conceptTypeMap.entries()].sort()) {
      console.log(`  ${type}: ${count}`);
    }
  }
}

main().catch((err) => {
  console.error("Transform failed:", err);
  process.exit(1);
});
