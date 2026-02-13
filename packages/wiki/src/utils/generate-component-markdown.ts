import type { Component } from "@wiki/shared";

/**
 * Generates a Markdown document from component data.
 * This is the same logic used by the [slug].md.ts API route.
 */
export function generateComponentMarkdown(data: Component): string {
  let md = `# ${data.name}\n\n`;

  // Metadata
  md += `- **Type:** ${data.type}\n`;
  md += `- **Tier:** ${data.tiers}\n`;
  md += `- **Documentation Status:** ${data.documentationStatus}\n`;
  md += `- **Last Edited:** ${data.lastEdited}\n`;
  if (data.figmaLink) md += `- **Figma:** ${data.figmaLink}\n`;
  if (data.codeLink) md += `- **Code:** ${data.codeLink}\n`;
  md += `\n`;

  // Description
  if (data.description) {
    md += `## Description\n\n${data.description}\n\n`;
  }

  // Anatomy
  if (data.anatomy && data.anatomy.table && data.anatomy.table.length > 0) {
    md += `## Anatomy\n\n`;
    md += `| # | Name | Description |\n`;
    md += `|---|------|-------------|\n`;
    for (const part of [...data.anatomy.table].sort(
      (a, b) => a.number - b.number,
    )) {
      md += `| ${part.number} | ${part.name} | ${part.description} |\n`;
    }
    md += `\n`;
  }

  // Usage
  if (data.usage) {
    md += `## Usage\n\n${data.usage}\n\n`;
  }

  // Examples
  if (data.examples) {
    md += `## Examples\n\n${data.examples}\n\n`;
  }

  // Properties
  if (data.properties && data.properties.length > 0) {
    md += `## Properties\n\n`;
    md += `| Name | Type | Required | Description | Constraint | Options | Default |\n`;
    md += `|------|------|----------|-------------|------------|---------|----------|\n`;
    for (const prop of data.properties) {
      const options =
        prop.options && prop.options.length > 0
          ? prop.options.join(", ")
          : "-";
      md += `| ${prop.name} | ${prop.type} | ${prop.required ? "Yes" : "No"} | ${prop.description || "-"} | ${prop.constraint || "-"} | ${options} | ${prop.defaultOption || "-"} |\n`;
    }
    md += `\n`;
  }

  // Child Properties
  if (data.childProperties && data.childProperties.length > 0) {
    md += `### Child Properties\n\n`;
    for (const child of data.childProperties) {
      md += `#### ${child.name}\n\n`;
      md += `| Name | Type | Required | Description | Constraint | Options | Default |\n`;
      md += `|------|------|----------|-------------|------------|---------|----------|\n`;
      for (const prop of child.properties) {
        const options =
          prop.options && prop.options.length > 0
            ? prop.options.join(", ")
            : "-";
        md += `| ${prop.name} | ${prop.type} | ${prop.required ? "Yes" : "No"} | ${prop.description || "-"} | ${prop.constraint || "-"} | ${options} | ${prop.defaultOption || "-"} |\n`;
      }
      md += `\n`;
    }
  }

  // Change log
  if (data.changeLog && data.changeLog.length > 0) {
    md += `## Change Log\n\n`;
    md += `| Who | When | What |\n`;
    md += `|-----|------|------|\n`;
    for (const entry of data.changeLog) {
      const when = new Date(entry.when).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      md += `| ${entry.who} | ${when} | ${entry.what} |\n`;
    }
    md += `\n`;
  }

  // Decision log
  if (data.decisionLog && data.decisionLog.length > 0) {
    md += `## Decision Log\n\n`;
    md += `| Where | Decision Made | Link |\n`;
    md += `|-------|---------------|------|\n`;
    for (const entry of data.decisionLog) {
      const link = entry.link ? `[View](${entry.link})` : "-";
      md += `| ${entry.where} | ${entry.decisionMade} | ${link} |\n`;
    }
    md += `\n`;
  }

  return md;
}
