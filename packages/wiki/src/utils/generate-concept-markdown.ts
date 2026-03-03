import type { Concept } from "@wiki/shared";
import { formatDate } from "./format-date";

/**
 * Generates a Markdown document from concept data.
 */
export function generateConceptMarkdown(data: Concept): string {
  let md = `# ${data.name}\n\n`;

  // Metadata
  md += `- **Type:** ${data.type}\n`;
  md += `- **Tier:** ${data.tier}\n`;
  md += `- **Documentation Status:** ${data.documentationStatus}\n`;
  md += `- **Last Edited:** ${data.lastEdited}\n`;
  md += `\n`;

  // Description
  if (data.description) {
    md += `## Description\n\n${data.description}\n\n`;
  }

  // Content
  if (data.content) {
    md += `## Content\n\n${data.content}\n\n`;
  }

  // Applied Rules
  if (data.appliedRules && data.appliedRules.length > 0) {
    md += `## Applied Rules\n\n`;
    md += `| Rule | Strength | Status | Type |\n`;
    md += `|------|----------|--------|------|\n`;
    for (const rule of data.appliedRules) {
      md += `| ${rule.rule} | ${rule.ruleStrength || "-"} | ${rule.status || "-"} | ${rule.type || "-"} |\n`;
    }
    md += `\n`;
  }

  // Change log
  if (data.changeLog && data.changeLog.length > 0) {
    md += `## Change Log\n\n`;
    md += `| Who | When | What |\n`;
    md += `|-----|------|------|\n`;
    for (const entry of data.changeLog) {
      md += `| ${entry.who} | ${formatDate(entry.when, "long")} | ${entry.what} |\n`;
    }
    md += `\n`;
  }

  // Decision log
  if (data.decisionLog && data.decisionLog.length > 0) {
    md += `## Decision Log\n\n`;
    md += `| Where | What | Link | When |\n`;
    md += `|-------|------|------|------|\n`;
    for (const entry of data.decisionLog) {
      const link = entry.link ? `[View](${entry.link})` : "-";
      const when = entry.when || "-";
      md += `| ${entry.where} | ${entry.what} | ${link} | ${when} |\n`;
    }
    md += `\n`;
  }

  // Mentioned in
  if (data.mentionedIn && data.mentionedIn.length > 0) {
    md += `## Mentioned In\n\n`;
    for (const entry of data.mentionedIn) {
      md += `- [${entry.name}](/${entry.slug})\n`;
    }
    md += `\n`;
  }

  // References (mentionsComponents)
  if (data.mentionsComponents && data.mentionsComponents.length > 0) {
    md += `## References\n\n`;
    const unique = [
      ...new Map(
        data.mentionsComponents.map((entry) => [entry.slug, entry]),
      ).values(),
    ];
    for (const entry of unique) {
      md += `- [${entry.name}](/${entry.slug})\n`;
    }
    md += `\n`;
  }

  return md;
}
