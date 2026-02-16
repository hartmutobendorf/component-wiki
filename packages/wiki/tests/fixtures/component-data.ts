import type { Component } from "@wiki/shared";

/**
 * A minimal valid component with only required fields.
 */
export const minimalComponent: Component = {
  name: "Button",
  slug: "button",
  type: "Component",
  tiers: "Global",
  documentationStatus: "All good",
  lastEdited: "2025-01-15",
  figmaLink: "",
  codeLink: "",
  description: "",
  usage: "",
  examples: "",
  interactions: "",
  figmaComponentData: "",
  componentExampleImage: "",
  properties: [],
  changeLog: [],
  decisionLog: [],
  mentionedIn: [],
};

/**
 * A fully populated component with all optional fields filled in.
 */
export const fullComponent: Component = {
  name: "Toggle Switch",
  slug: "toggle-switch",
  type: "Complex component",
  tiers: "Sites",
  documentationStatus: "Minimal",
  lastEdited: "2025-06-01",
  figmaLink: "https://figma.com/file/abc123",
  codeLink: "https://github.com/org/repo/tree/main/src/toggle",
  description:
    "A toggle switch lets users **turn something on or off** instantly.",
  usage:
    "Use toggle switches when the user needs to toggle a single setting.\n\n- Do use for binary choices\n- Don't use for multiple selections",
  examples:
    "### Basic Toggle\n\nA simple on/off toggle.\n\n### Disabled Toggle\n\nA toggle that cannot be interacted with.",
  interactions: "",
  figmaComponentData: "<div>Figma component HTML</div>",
  componentExampleImage: "images/toggle-example.png",
  anatomy: {
    image: "images/toggle-anatomy.png",
    table: [
      {
        number: 2,
        name: "Thumb",
        description: "The circular indicator that slides.",
      },
      {
        number: 1,
        name: "Track",
        description: "The background rail the thumb moves along.",
      },
      {
        number: 3,
        name: "Label",
        description: "Optional text label next to the toggle.",
      },
    ],
  },
  properties: [
    {
      name: "checked",
      required: true,
      type: "boolean",
      description: "Whether the toggle is on or off.",
      constraint: "",
      defaultOption: "false",
      options: [],
    },
    {
      name: "disabled",
      required: false,
      type: "boolean",
      description: "Disables the toggle.",
      constraint: "",
      defaultOption: "false",
      options: [],
    },
    {
      name: "size",
      required: false,
      type: "single select",
      description: "The size of the toggle.",
      constraint: "Must be one of the listed options",
      defaultOption: "medium",
      options: ["small", "medium", "large"],
    },
  ],
  childProperties: [
    {
      name: "Toggle Label",
      properties: [
        {
          name: "text",
          required: true,
          type: "string",
          description: "The text content of the label.",
          constraint: "Max 100 characters",
          defaultOption: "",
          options: [],
        },
        {
          name: "position",
          required: false,
          type: "single select",
          description: "Position of the label relative to the toggle.",
          constraint: "",
          defaultOption: "right",
          options: ["left", "right"],
        },
      ],
    },
  ],
  changeLog: [
    {
      who: "Alice",
      when: "2025-01-10",
      what: "Initial component creation",
    },
    {
      who: "Bob",
      when: "2025-03-15",
      what: "Added disabled state",
    },
  ],
  decisionLog: [
    {
      where: "Design review",
      what: "Use rounded thumb style",
      link: "https://example.com/meeting/123",
      when: "2025-02-01",
    },
    {
      where: "Accessibility audit",
      what: "Add ARIA attributes",
      link: "",
      when: "",
    },
  ],
  mentionedIn: [
    { name: "Form placement", slug: "form-placement" },
    { name: "Settings page", slug: "settings-page" },
  ],
};

/**
 * A component with only description filled (no usage/examples/properties etc).
 */
export const descriptionOnlyComponent: Component = {
  ...minimalComponent,
  name: "Divider",
  slug: "divider",
  type: "Foundation",
  tiers: "Global",
  description: "A horizontal line to separate content sections.",
};

/**
 * A component with anatomy but no image.
 */
export const anatomyNoImageComponent: Component = {
  ...minimalComponent,
  name: "Badge",
  slug: "badge",
  anatomy: {
    image: "",
    table: [
      { number: 1, name: "Container", description: "The badge wrapper." },
      { number: 2, name: "Label", description: "The badge text." },
    ],
  },
};

/**
 * A component with empty anatomy table.
 */
export const emptyAnatomyComponent: Component = {
  ...minimalComponent,
  name: "Spacer",
  slug: "spacer",
  anatomy: {
    image: "images/spacer-anatomy.png",
    table: [],
  },
};
