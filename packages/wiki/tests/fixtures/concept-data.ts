import type { Concept } from "@wiki/shared";

/**
 * A minimal valid concept with only required fields.
 */
export const minimalConcept: Concept = {
  name: "Spacing",
  slug: "spacing",
  type: "Principle",
  tier: "Global",
  documentationStatus: "All good",
  lastEdited: "2025-02-20",
  description: "",
  content: "",
  changeLog: [],
  decisionLog: [],
  appliedRules: [],
  exceptedFromRules: [],
  mentionedIn: [],
  mentionsComponents: [],
};

/**
 * A fully populated concept with all optional fields filled in.
 */
export const fullConcept: Concept = {
  name: "Form Layout",
  slug: "form-layout",
  type: "Pattern",
  tier: "Sites",
  documentationStatus: "Minimal",
  lastEdited: "2025-05-10",
  description:
    "Form layout defines how **form elements** are arranged on a page.",
  content:
    "## Principles\n\nForms should be laid out in a single column for readability.\n\n## Exceptions\n\nMulti-column layouts are acceptable for short, related fields like first/last name.",
  changeLog: [
    {
      who: "Alice",
      when: "2025-03-01",
      what: "Initial concept creation",
    },
    {
      who: "Charlie",
      when: "2025-05-10",
      what: "Added multi-column exception",
    },
  ],
  decisionLog: [
    {
      where: "Design review",
      what: "Single column default",
      link: "https://example.com/decision/456",
      when: "2025-03-15",
    },
    {
      where: "UX audit",
      what: "Allow inline field groups",
      link: "",
      when: "",
    },
  ],
  appliedRules: [
    {
      rule: "Labels must be above inputs",
      ruleStrength: "Must",
      status: "Active",
      type: "Layout",
      lastEdited: "2025-03-01",
      appliesToConcepts: [],
      appliesToConstructs: [],
      knownExceptionForConstructs: "",
      knownExceptionForConcepts: "",
      changeLog: [],
      decisionLog: [],
    },
    {
      rule: "Error messages appear below inputs",
      ruleStrength: "Should",
      status: "Active",
      type: "Validation",
      lastEdited: "2025-04-01",
      appliesToConcepts: [],
      appliesToConstructs: [],
      knownExceptionForConstructs: "",
      knownExceptionForConcepts: "",
      changeLog: [],
      decisionLog: [],
    },
  ],
  exceptedFromRules: [],
  mentionedIn: [
    { name: "Input", slug: "input" },
    { name: "Select", slug: "select" },
  ],
  mentionsComponents: [
    { name: "Button", slug: "button" },
    { name: "Input", slug: "input" },
    { name: "Button", slug: "button" }, // duplicate to test deduplication
  ],
};

/**
 * A concept with only description filled.
 */
export const descriptionOnlyConcept: Concept = {
  ...minimalConcept,
  name: "Typography",
  slug: "typography",
  description: "Typography defines the visual hierarchy through text styles.",
};

/**
 * A concept with content but no description.
 */
export const contentOnlyConcept: Concept = {
  ...minimalConcept,
  name: "Colour Usage",
  slug: "colour-usage",
  content: "Use the brand palette for primary actions and neutral tones for backgrounds.",
};
