import { cpSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
const DIST = resolve(PKG_ROOT, "dist");
const DATA_SRC = resolve(PKG_ROOT, "../../data/agent");

// The skill directory name must match the `name` field in SKILL.md frontmatter.
// See: https://agentskills.io/specification
const SKILL_NAME = "vanilla-design-system";
const SKILLS_DIR = resolve(DIST, "skills", SKILL_NAME);

// Clean dist
rmSync(DIST, { recursive: true, force: true });
mkdirSync(SKILLS_DIR, { recursive: true });

// Copy SKILL.md → dist/skills/vanilla-design-system/SKILL.md
cpSync(resolve(__dirname, "SKILL.md"), resolve(SKILLS_DIR, "SKILL.md"));

// Copy data/agent/ → dist/skills/vanilla-design-system/data/
cpSync(DATA_SRC, resolve(SKILLS_DIR, "data"), { recursive: true });

// Write Claude Code plugin manifest → dist/.claude-plugin/plugin.json
const pluginDir = resolve(DIST, ".claude-plugin");
mkdirSync(pluginDir, { recursive: true });
const pluginJson = {
  name: SKILL_NAME,
  description:
    "Explore Canonical's Vanilla Framework design system documentation. " +
    "Covers 49 UI components including their properties, anatomy, usage " +
    "guidelines, and relationships.",
  version: "0.0.1",
};
writeFileSync(
  resolve(pluginDir, "plugin.json"),
  JSON.stringify(pluginJson, null, 2) + "\n",
);

console.log(`✅ @wiki/agent-skill — Built dist/ with plugin manifest + skills/${SKILL_NAME}/`);
