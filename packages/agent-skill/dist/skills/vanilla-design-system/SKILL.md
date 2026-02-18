---
name: vanilla-design-system
description: >
  Explore Canonical's Vanilla Framework design system documentation.
  Covers 49 UI constructs and 26 concepts including their properties,
  anatomy, usage guidelines, and relationships. Use when answering
  questions about Vanilla constructs, concepts, design patterns, or
  implementation details.
---

# Vanilla Framework Design System

This skill provides structured access to the complete documentation for Canonical's Vanilla Framework design system — 49 constructs (UI components, complex components, patterns, and mental models) and 26 concepts (architecture, decision guides, and principles).

## CRITICAL: Citation and sourcing rules

**Every claim must be sourced from the data and cited.** Follow these rules without exception:

1. **NEVER invent or fabricate documentation.** Every statement about a construct or concept — its properties, anatomy, usage, behavior, relationships — MUST come from the data files. If something is not documented in the data, say so explicitly: "This is not documented in the Vanilla Framework design system documentation." Do NOT guess, infer, or fill in gaps with general knowledge.

2. **ALWAYS look up the data before answering.** Even if you think you know the answer, query the data files to confirm. The data is the single source of truth.

3. **Cite using numbered references.** Place a bracketed number at the end of a **paragraph or logical grouping of related claims**, not after every single sentence. If multiple consecutive sentences come from the same source, use ONE citation at the end of the group. Do NOT repeat the same citation number on every sentence. Collect all references at the end of your response under a `## References` heading. Every number used inline MUST appear there. Every entry there MUST be used inline.

Get the URL from the `url` field in each construct's or concept's data file.

## Data structure

The data is organized in two layers for efficient exploration:

### Layer 1: Index (`data/index.json`)

A lightweight catalogue of all constructs and concepts. Use this first to browse, filter, and find items.

Top-level metadata includes: `generatedAt`, `constructCount`, `conceptCount`, `constructTypes`, `constructTiers`, `conceptTypes`.

Each construct entry contains: `name`, `slug`, `type`, `tiers`, `description` (full markdown description).

Each concept entry contains: `name`, `slug`, `type`, `tier`, `description`.

### Layer 2: Per-construct detail files (`data/constructs/<slug>.json`)

Full documentation for each construct. Fields include:

| Field                  | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| `name`, `slug`         | Construct name and URL-safe identifier                                           |
| `type`                 | One of: Component, Complex component, Pattern, Mental model                      |
| `tiers`                | One of: Global, Sites, Apps                                                      |
| `url`                  | Canonical documentation URL                                                      |
| `description`          | Full markdown description                                                        |
| `usage`                | Usage guidelines (markdown)                                                      |
| `examples`             | Usage examples (markdown)                                                        |
| `interactions`         | Interaction specifications (markdown)                                            |
| `properties[]`         | Each with: name, type, required, description, constraint, options, defaultOption |
| `anatomy.table[]`      | Each with: number, name, description                                             |
| `mentionedIn[]`        | Items that reference this one (name, slug)                                       |
| `mentionsComponents[]` | Items this one references (name, slug)                                           |
| `appliedRules[]`       | Rule row IDs that apply to this construct                                        |
| `exceptionFromRules[]` | Rule row IDs this construct is excepted from                                     |
| `changeLog[]`          | Edit history (who, when, what)                                                   |
| `decisionLog[]`        | Design decisions (where, what, link, when)                                       |
| `figmaLink`            | Figma design file URL                                                            |
| `codeLink`             | Source code URL                                                                  |

### Layer 3: Per-concept detail files (`data/concepts/<slug>.json`)

Full documentation for each concept. Fields include:

| Field                  | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `name`, `slug`         | Concept name and URL-safe identifier                 |
| `type`                 | One of: Architecture, Decision guide, Principle      |
| `tier`                 | One of: Global, Sites                                |
| `url`                  | Canonical documentation URL                          |
| `description`          | Short description                                    |
| `content`              | Full concept content (markdown)                      |
| `mentionedIn[]`        | Items that reference this concept (name, slug)       |
| `appliedRules[]`       | Rule row IDs that apply to this concept              |
| `exceptedFromRules[]`  | Rule row IDs this concept is excepted from           |
| `changeLog[]`          | Edit history (who, when, what)                       |
| `decisionLog[]`        | Design decisions (where, what, link, when)           |

## How to explore the data

Data files are in the `data/` directory next to this file. **Always use absolute paths in all commands, resolved from the known location of this file.** Do not use bare relative paths like `data/index.json` — they will fail if the working directory is different.

Use `jq` and `bash` to query the JSON data files. Do NOT attempt to load entire files into context. Instead, use targeted jq queries to extract only the fields you need for each question.

### Recommended workflow

1. **Start with the index** — query `data/index.json` to find relevant constructs or concepts
2. **Filter** — use jq to narrow down to what matches the question
3. **Drill in** — read specific fields from construct or concept detail files
4. **Cite** — include the `url` from every item you reference

### jq examples

The following are examples to illustrate the kinds of queries you can run. Adapt them to the question at hand — these are not an exhaustive list:

```bash
# List all construct names
jq -r '.constructs[].name' data/index.json

# List all concept names
jq -r '.concepts[].name' data/index.json

# Filter constructs by type
jq -r '.constructs[] | select(.type == "Pattern") | .slug' data/index.json

# Filter concepts by type
jq -r '.concepts[] | select(.type == "Architecture") | .slug' data/index.json

# Search construct descriptions for a keyword
jq -r '.constructs[] | select(.description | test("form"; "i")) | .slug' data/index.json

# Get a construct's properties
jq '.properties[] | {name, type, required, defaultOption}' data/constructs/button.json

# Get anatomy parts
jq '.anatomy.table[] | {name, description}' data/constructs/button.json

# What items mention Button?
jq '.mentionedIn[] | .name' data/constructs/button.json

# What items does Button reference?
jq '.mentionsComponents[] | .name' data/constructs/button.json

# Get usage guidelines
jq -r '.usage' data/constructs/input.json

# Get the documentation URL
jq -r '.url' data/constructs/button.json

# List all constructs with their types (compact overview)
jq -r '.constructs[] | "\(.type) | \(.name)"' data/index.json | sort

# List all concepts with their types
jq -r '.concepts[] | "\(.type) | \(.name)"' data/index.json | sort

# Get a concept's full content
jq -r '.content' data/concepts/site.json

# Get counts
jq '{constructCount, conceptCount}' data/index.json
```
