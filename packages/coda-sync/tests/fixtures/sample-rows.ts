/**
 * Test fixtures matching the exact shape of Coda API responses (rich format).
 *
 * Structure and field names are real; all content is fictional.
 */

// ── Row-level fixtures (used in normalize tests) ────────────────────────────

/** A component row — the richest row type, covering all value shapes */
export const componentRow = {
  id: "i-abc123def4",
  type: "row",
  href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-comp01/rows/i-abc123def4",
  name: "Toggle switch",
  index: 12,
  createdAt: "2025-06-15T10:30:00.000Z",
  updatedAt: "2025-07-20T14:45:12.500Z",
  browserLink:
    "https://coda.io/d/_dFakeDoc99#_tugrid-comp01/_rui-abc123def4",
  values: {
    Name: "```Toggle switch```",
    "Documentation status": {
      "@context": "http://schema.org/",
      "@type": "StructuredValue",
      additionalType: "row",
      name: "Draft",
      url: "https://coda.io/d/_dFakeDoc99#_tugrid-statuses/_rui-stat01",
      tableId: "grid-statuses",
      rowId: "i-stat01",
      tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-statuses",
    },
    Usage:
      "Use the toggle switch when you need to let users turn a single option on or off instantly.",
    Description:
      "A toggle switch is a compact control that represents a binary choice, such as enabling or disabling a feature.",
    Examples: "",
    Type: {
      "@context": "http://schema.org/",
      "@type": "StructuredValue",
      additionalType: "row",
      name: "Interactive control",
      url: "https://coda.io/d/_dFakeDoc99#_tugrid-types/_rui-type01",
      tableId: "grid-types",
      rowId: "i-type01",
      tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-types",
    },
    "Last edited": "2025-07-20T14:45:12.500+00:00",
    Figma: {
      "@context": "http://schema.org/",
      "@type": "WebPage",
      url: "https://www.figma.com/design/fakeFile123/My-Library",
    },
    Code: "",
    Tiers: {
      "@context": "http://schema.org/",
      "@type": "StructuredValue",
      additionalType: "row",
      name: "Core",
      url: "https://coda.io/d/_dFakeDoc99#_tugrid-tiers/_rui-tier01",
      tableId: "grid-tiers",
      rowId: "i-tier01",
      tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-tiers",
    },
    "Component example image": [
      {
        "@context": "http://schema.org/",
        "@type": "ImageObject",
        name: "toggle-example.png",
        height: 400,
        width: 800,
        url: "https://codahosted.io/docs/dFakeDoc99/blobs/bl-toggle01/toggle-example.png",
        status: "live",
      },
    ],
    "Figma component data": "",
    "Change log": [
      {
        "@context": "http://schema.org/",
        "@type": "StructuredValue",
        additionalType: "row",
        name: "Initial draft",
        url: "https://coda.io/d/_dFakeDoc99#_tugrid-changelog/_rui-cl01",
        tableId: "grid-changelog",
        rowId: "i-cl01",
        tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-changelog",
      },
    ],
    Properties: [],
    Anatomy: [
      {
        "@context": "http://schema.org/",
        "@type": "StructuredValue",
        additionalType: "row",
        name: "Track",
        url: "https://coda.io/d/_dFakeDoc99#_tugrid-anatomy/_rui-an01",
        tableId: "grid-anatomy",
        rowId: "i-an01",
        tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-anatomy",
      },
      {
        "@context": "http://schema.org/",
        "@type": "StructuredValue",
        additionalType: "row",
        name: "Thumb",
        url: "https://coda.io/d/_dFakeDoc99#_tugrid-anatomy/_rui-an02",
        tableId: "grid-anatomy",
        rowId: "i-an02",
        tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-anatomy",
      },
    ],
    "Anatomy image": [
      {
        "@context": "http://schema.org/",
        "@type": "ImageObject",
        name: "toggle-anatomy.png",
        height: 400,
        width: 800,
        url: "https://codahosted.io/docs/dFakeDoc99/blobs/bl-toggle02/toggle-anatomy.png",
        status: "live",
      },
    ],
    "UI blocks used in pattern": "",
    "Decision log": [],
    "Sites - architecture levels": {
      "@context": "http://schema.org/",
      "@type": "StructuredValue",
      additionalType: "row",
      name: "Primitive",
      url: "https://coda.io/d/_dFakeDoc99#_tugrid-levels/_rui-lv01",
      tableId: "grid-levels",
      rowId: "i-lv01",
      tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-levels",
    },
    Interactions: "",
  },
};

/** A property row — booleans, backtick strings, single relation */
export const propertyRow = {
  id: "i-prop55xyz",
  type: "row",
  href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-props/rows/i-prop55xyz",
  name: "Disabled",
  index: 3,
  createdAt: "2025-05-10T08:00:00.000Z",
  updatedAt: "2025-05-10T08:30:00.000Z",
  browserLink:
    "https://coda.io/d/_dFakeDoc99#_tugrid-props/_rui-prop55xyz",
  values: {
    Name: "```Disabled```",
    Required: false,
    Type: {
      "@context": "http://schema.org/",
      "@type": "StructuredValue",
      additionalType: "row",
      name: "Boolean",
      url: "https://coda.io/d/_dFakeDoc99#_tugrid-proptypes/_rui-pt01",
      tableId: "grid-proptypes",
      rowId: "i-pt01",
      tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-proptypes",
    },
    Description: "```Prevents user interaction when set to true```",
    Constraint: "```Must be true or false```",
    Options: "```true, false```",
    "Default option": "```false```",
    Component: [
      {
        "@context": "http://schema.org/",
        "@type": "StructuredValue",
        additionalType: "row",
        name: "Toggle switch",
        url: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01/_rui-abc123def4",
        tableId: "grid-comp01",
        rowId: "i-abc123def4",
        tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01",
      },
    ],
  },
};

/** A changelog row — StructuredValue Construct (relation), date, StructuredValue Who */
export const changelogRow = {
  id: "i-cl-entry07",
  type: "row",
  href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-changelog/rows/i-cl-entry07",
  name: "Added accessibility notes and keyboard navigation details",
  index: 7,
  createdAt: "2025-08-01T11:00:00.000Z",
  updatedAt: "2025-08-01T11:05:00.000Z",
  browserLink:
    "https://coda.io/d/_dFakeDoc99#_tugrid-changelog/_rui-cl-entry07",
  values: {
    Construct: {
      "@context": "http://schema.org/",
      "@type": "StructuredValue",
      additionalType: "row",
      name: "Toggle switch",
      url: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01/_rui-abc123def4",
      tableId: "grid-comp01",
      rowId: "i-abc123def4",
      tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01",
    },
    When: "2025-08-01T11:00:00.000+00:00",
    What: "```Added accessibility notes and keyboard navigation details```",
    Who: {
      "@context": "http://schema.org/",
      "@type": "StructuredValue",
      additionalType: "row",
      name: "Alex Rivera",
      url: "https://coda.io/d/_dFakeDoc99#_tugrid-editors/_rui-ed02",
      tableId: "grid-editors",
      rowId: "i-ed02",
      tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-editors",
    },
    Concept: "",
  },
};

/** An editor row — @type Person with email and userId */
export const editorRow = {
  id: "i-ed02",
  type: "row",
  href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-editors/rows/i-ed02",
  name: "Alex Rivera",
  index: 1,
  createdAt: "2025-04-01T09:00:00.000Z",
  updatedAt: "2025-04-01T09:10:00.000Z",
  browserLink:
    "https://coda.io/d/_dFakeDoc99#_tugrid-editors/_rui-ed02",
  values: {
    Name: {
      "@context": "http://schema.org/",
      "@type": "Person",
      name: "Alex Rivera",
      email: "alex.rivera@example.com",
      userId: 9990001,
    },
    Changelog: [
      {
        "@context": "http://schema.org/",
        "@type": "StructuredValue",
        additionalType: "row",
        name: "Added accessibility notes and keyboard navigation details",
        url: "https://coda.io/d/_dFakeDoc99#_tugrid-changelog/_rui-cl-entry07",
        tableId: "grid-changelog",
        rowId: "i-cl-entry07",
        tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-changelog",
      },
    ],
  },
};

/** An anatomy row — numeric Number field, single StructuredValue relation */
export const anatomyRow = {
  id: "i-an01",
  type: "row",
  href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-anatomy/rows/i-an01",
  name: "Track",
  index: 0,
  createdAt: "2025-06-20T12:00:00.000Z",
  updatedAt: "2025-06-20T12:15:00.000Z",
  browserLink:
    "https://coda.io/d/_dFakeDoc99#_tugrid-anatomy/_rui-an01",
  values: {
    Number: 1,
    Name: "```Track```",
    Description:
      "```The horizontal bar that visually represents the on and off states.```",
    Component: {
      "@context": "http://schema.org/",
      "@type": "StructuredValue",
      additionalType: "row",
      name: "Toggle switch",
      url: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01/_rui-abc123def4",
      tableId: "grid-comp01",
      rowId: "i-abc123def4",
      tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01",
    },
  },
};

/** A status row — plain Name (no backticks), multiline Description, relation array */
export const documentationStatusRow = {
  id: "i-stat01",
  type: "row",
  href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-statuses/rows/i-stat01",
  name: "Draft",
  index: 0,
  createdAt: "2025-03-01T08:00:00.000Z",
  updatedAt: "2025-03-15T10:00:00.000Z",
  browserLink:
    "https://coda.io/d/_dFakeDoc99#_tugrid-statuses/_rui-stat01",
  values: {
    Name: "Draft",
    Components: [
      {
        "@context": "http://schema.org/",
        "@type": "StructuredValue",
        additionalType: "row",
        name: "Toggle switch",
        url: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01/_rui-abc123def4",
        tableId: "grid-comp01",
        rowId: "i-abc123def4",
        tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01",
      },
      {
        "@context": "http://schema.org/",
        "@type": "StructuredValue",
        additionalType: "row",
        name: "Slider",
        url: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01/_rui-comp02",
        tableId: "grid-comp01",
        rowId: "i-comp02",
        tableUrl: "https://coda.io/d/_dFakeDoc99#_tugrid-comp01",
      },
    ],
    Description:
      "The page has initial content but is not yet ready for review.\n\nMissing sections may include:\n- Usage guidelines\n- Anatomy diagram\n- Properties table",
  },
};

// ── Pagination response fixtures ────────────────────────────────────────────

/** Page 1 of a paginated API response (real shape) */
export const paginatedResponsePage1 = {
  items: [
    {
      id: "i-abc123def4",
      type: "row",
      href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-comp01/rows/i-abc123def4",
      name: "Toggle switch",
      index: 12,
      createdAt: "2025-06-15T10:30:00.000Z",
      updatedAt: "2025-07-20T14:45:12.500Z",
      browserLink:
        "https://coda.io/d/_dFakeDoc99#_tugrid-comp01/_rui-abc123def4",
      values: { Name: "```Toggle switch```" },
    },
    {
      id: "i-comp02",
      type: "row",
      href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-comp01/rows/i-comp02",
      name: "Slider",
      index: 13,
      createdAt: "2025-06-16T09:00:00.000Z",
      updatedAt: "2025-07-18T11:20:00.000Z",
      browserLink:
        "https://coda.io/d/_dFakeDoc99#_tugrid-comp01/_rui-comp02",
      values: { Name: "```Slider```" },
    },
  ],
  href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-comp01/rows?pageToken=abc",
  nextPageToken: "eyJsaW1pdCI6MiwidG9rZW4iOiJwYWdlMiJ9",
  nextPageLink:
    "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-comp01/rows?pageToken=eyJsaW1pdCI6MiwidG9rZW4iOiJwYWdlMiJ9",
  nextSyncToken: "eyJzb3J0QnkiOiJjcmVhdGVkQXQiLCJzdGFydEF0IjoxNzUwMDAwMDAwfQ",
};

/** Page 2 of a paginated API response (last page — no nextPageToken) */
export const paginatedResponsePage2 = {
  items: [
    {
      id: "i-comp03",
      type: "row",
      href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-comp01/rows/i-comp03",
      name: "Dropdown",
      index: 14,
      createdAt: "2025-06-17T08:00:00.000Z",
      updatedAt: "2025-07-19T16:30:00.000Z",
      browserLink:
        "https://coda.io/d/_dFakeDoc99#_tugrid-comp01/_rui-comp03",
      values: { Name: "```Dropdown```" },
    },
  ],
  href: "https://coda.io/apis/v1/docs/dFakeDoc99/tables/grid-comp01/rows?pageToken=xyz",
  nextPageToken: undefined,
};
