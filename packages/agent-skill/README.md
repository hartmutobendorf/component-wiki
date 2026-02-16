# Vanilla Design System Agent Skill

An agent skill for exploring Canonical's [Vanilla Framework](https://vanillaframework.io) design system documentation. Covers 49 UI components including their properties, anatomy, usage guidelines, and relationships.

## What it does

- Browse and filter all 49 components by type, tier, or keyword
- Look up properties, anatomy, usage guidelines, and interaction specs
- Explore component relationships (which components reference each other)
- Access design decisions and changelog history

The skill uses structured JSON data that agents query with `jq`, loading only what's needed per question — no large context dumps.

## Installation

This skill follows the open [Agent Skills](https://agentskills.io) standard and works with multiple AI coding tools.

### Claude Code

```shell
/plugin marketplace add dgtlntv/component-wiki
/plugin install vanilla-design-system@component-wiki
```

### Pi

```shell
git clone https://github.com/dgtlntv/component-wiki /tmp/component-wiki
cp -r /tmp/component-wiki/packages/agent-skill/dist/skills/vanilla-design-system ~/.pi/agent/skills/
```

Or add to your project's `.pi/skills/`:

```shell
cp -r /tmp/component-wiki/packages/agent-skill/dist/skills/vanilla-design-system .pi/skills/
```

### Gemini CLI

```shell
# Enable experimental.skills in /settings first
gemini skills install https://github.com/dgtlntv/component-wiki.git --path packages/agent-skill/dist/skills/vanilla-design-system
```

### GitHub Copilot (VS Code & CLI)

```shell
git clone https://github.com/dgtlntv/component-wiki /tmp/component-wiki
cp -r /tmp/component-wiki/packages/agent-skill/dist/skills/vanilla-design-system ~/.copilot/skills/

# Or add to your repo
cp -r /tmp/component-wiki/packages/agent-skill/dist/skills/vanilla-design-system .github/skills/
```

### OpenAI Codex CLI

Use the `$skill-installer` skill and prompt it to install from this repository:

```
$skill-installer install vanilla-design-system from https://github.com/dgtlntv/component-wiki, path packages/agent-skill/dist/skills/vanilla-design-system
```

### Manual / Other agents

Any agent that supports the [Agent Skills standard](https://agentskills.io/specification) can use this skill. Clone the repo and point your agent at:

```
packages/agent-skill/dist/skills/vanilla-design-system/
```

## Usage

Example prompts:

- "What properties does the Button component have?"
- "Which components are used in the Hero pattern?"
- "How should I use the Segmented control component?"
- "What are all the pattern-type components?"

## Building from source

The skill is pre-built and committed to `dist/`. To rebuild after changes:

```shell
# From the repo root
pnpm transform                          # Regenerate data/agent/ from raw data
pnpm --filter @wiki/agent-skill build   # Build the skill package
```
