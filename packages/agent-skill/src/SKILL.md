---
name: vanilla-design-system
description: >
  Explore Canonical's Vanilla Framework design system documentation.
  Covers 49 UI components including their properties, anatomy, usage
  guidelines, and relationships. Use when answering questions about
  Vanilla components, design patterns, or implementation details.
---

# Vanilla Framework Design System

This skill provides structured access to the complete documentation for Canonical's Vanilla Framework design system — 49 components covering UI components, complex components, patterns, and mental models.

## CRITICAL: Citation and sourcing rules

**Every claim must be sourced from the data and cited.** Follow these rules without exception:

1. **NEVER invent or fabricate documentation.** Every statement about a component — its properties, anatomy, usage, behavior, relationships — MUST come from the data files. If something is not documented in the data, say so explicitly: "This is not documented in the Vanilla Framework design system documentation." Do NOT guess, infer, or fill in gaps with general knowledge.

2. **ALWAYS look up the data before answering.** Even if you think you know the answer, query the data files to confirm. The data is the single source of truth.

3. **Cite using numbered references.** Place a bracketed number at the end of a **paragraph or logical grouping of related claims**, not after every single sentence. If multiple consecutive sentences come from the same source, use ONE citation at the end of the group. Do NOT repeat the same citation number on every sentence. Collect all references at the end of your response under a `## References` heading. Every number used inline MUST appear there. Every entry there MUST be used inline.

Get the URL from the `url` field in each component's data file.

## Data structure

The data is organized in two layers for efficient exploration:

### Layer 1: Index (`data/index.json`)

A lightweight catalogue of all components. Use this first to browse, filter, and find components.

Each entry contains: `name`, `slug`, `type`, `tiers`, `description` (full markdown description).

Top-level metadata includes: `generatedAt`, `componentCount`, `types`, `tiers`, `components[]`.

### Layer 2: Per-component detail files (`data/components/<slug>.json`)

Full documentation for each component. Fields include:

| Field                  | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| `name`, `slug`         | Component name and URL-safe identifier                                           |
| `type`                 | One of: Component, Complex component, Pattern, Mental model                      |
| `tiers`                | One of: Global, Sites, Apps                                                      |
| `url`                  | Canonical documentation URL                                                      |
| `description`          | Full markdown description                                                        |
| `usage`                | Usage guidelines (markdown)                                                      |
| `examples`             | Usage examples (markdown)                                                        |
| `interactions`         | Interaction specifications (markdown)                                            |
| `properties[]`         | Each with: name, type, required, description, constraint, options, defaultOption |
| `anatomy.table[]`      | Each with: number, name, description                                             |
| `mentionedIn[]`        | Components that reference this one (name, slug)                                  |
| `mentionsComponents[]` | Components this one references (name, slug)                                      |
| `changeLog[]`          | Edit history (who, when, what)                                                   |
| `decisionLog[]`        | Design decisions (where, decisionMade, link)                                     |
| `figmaLink`            | Figma design file URL                                                            |
| `codeLink`             | Source code URL                                                                  |

## How to explore the data

Data files are in the `data/` directory next to this file. **Always use absolute paths in all commands, resolved from the known location of this file.** Do not use bare relative paths like `data/index.json` — they will fail if the working directory is different.

Use `jq` and `bash` to query the JSON data files. Do NOT attempt to load entire files into context. Instead, use targeted jq queries to extract only the fields you need for each question.

### Recommended workflow

1. **Start with the index** — query `data/index.json` to find relevant components
2. **Filter** — use jq to narrow down to what matches the question
3. **Drill in** — read specific fields from specific component detail files
4. **Cite** — include the `url` from every component you reference

### jq examples

The following are examples to illustrate the kinds of queries you can run. Adapt them to the question at hand — these are not an exhaustive list:

```bash
# List all component names
jq -r '.components[].name' data/index.json

# Filter by type
jq -r '.components[] | select(.type == "Pattern") | .slug' data/index.json

# Search descriptions for a keyword
jq -r '.components[] | select(.description | test("form"; "i")) | .slug' data/index.json

# Get a component's properties
jq '.properties[] | {name, type, required, defaultOption}' data/components/button.json

# Get anatomy parts
jq '.anatomy.table[] | {name, description}' data/components/button.json

# What components mention Button?
jq '.mentionedIn[] | .name' data/components/button.json

# What components does Button reference?
jq '.mentionsComponents[] | .name' data/components/button.json

# Get usage guidelines
jq -r '.usage' data/components/input.json

# Get the documentation URL
jq -r '.url' data/components/button.json

# List all components with their types (compact overview)
jq -r '.components[] | "\(.type) | \(.name)"' data/index.json | sort
```
