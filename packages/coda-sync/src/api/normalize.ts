/**
 * Value normalizer — strips Coda rich-format metadata, extracts clean values.
 *
 * Handles:
 *  - StructuredValue with rowId inside an array → rowId string (relation column)
 *  - StructuredValue with rowId as single value → name string (lookup column)
 *  - StructuredValue without rowId → name string
 *  - ImageObject → collect URL, return local path placeholder
 *  - WebPage → url string
 *  - Scalars → pass through (strip triple-backtick wrapping)
 *  - Arrays → normalize each element (array context enables rowId extraction)
 */

export interface CollectedImage {
  url: string;
  localPath: string;
}

/**
 * Tracks image URLs encountered during normalization for later download.
 */
export class ImageCollector {
  private images: Map<string, CollectedImage> = new Map();

  collect(url: string): string {
    if (this.images.has(url)) {
      return this.images.get(url)!.localPath;
    }
    const ext = extractExtension(url);
    const localPath = `images/${crypto.randomUUID()}${ext}`;
    this.images.set(url, { url, localPath });
    return localPath;
  }

  getAll(): CollectedImage[] {
    return [...this.images.values()];
  }
}

function extractExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const lastDot = pathname.lastIndexOf(".");
    if (lastDot !== -1) {
      const ext = pathname.substring(lastDot);
      if (ext.length <= 5 && /^\.[a-z]+$/i.test(ext)) {
        return ext;
      }
    }
  } catch {
    // Not a valid URL
  }
  return ".png";
}

/**
 * Strip triple-backtick wrapping from rich-format text values.
 * Coda wraps short/code text in ```text``` in rich format.
 */
function stripBackticks(value: string): string {
  if (value.startsWith("```") && value.endsWith("```")) {
    return value.slice(3, -3);
  }
  return value;
}

/**
 * Strip unusual Unicode line terminators that cause editor warnings.
 * LS (\u2028) and PS (\u2029) are valid in JSON but problematic in editors.
 */
function cleanLineTerminators(value: string): string {
  return value.replace(/[\u2028\u2029]/g, "\n");
}

/**
 * Normalize a single Coda rich-format value to a clean value.
 */
export function normalizeValue(
  value: unknown,
  imageCollector: ImageCollector
): unknown {
  if (value === null || value === undefined || value === "") {
    return value;
  }

  // Arrays — normalize each element
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, imageCollector));
  }

  // Scalars
  if (typeof value === "string") {
    return cleanLineTerminators(stripBackticks(value));
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  // Objects — check @type
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const type = obj["@type"] as string | undefined;

    if (type === "ImageObject") {
      const url = obj["url"] as string;
      if (url) {
        return imageCollector.collect(url);
      }
      return "";
    }

    if (type === "WebPage") {
      return (obj["url"] as string) || "";
    }

    if (type === "StructuredValue") {
      if (obj["rowId"]) {
        return obj["rowId"] as string;
      }
      return ((obj["name"] as string) || "").trim();
    }

    // Unknown object type
    if (obj["name"]) {
      return obj["name"] as string;
    }
    return value;
  }

  return value;
}

/**
 * Convert a column name to camelCase.
 * "Documentation status" → "documentationStatus"
 * "Last edited" → "lastEdited"
 */
function toCamelCase(columnName: string): string {
  return columnName
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

export interface NormalizedRow {
  rowId: string;
  [key: string]: unknown;
}

/**
 * Normalize all values in a row, mapping column names to camelCase.
 */
export function normalizeRow(
  rowId: string,
  values: Record<string, unknown>,
  imageCollector: ImageCollector
): NormalizedRow {
  const normalized: NormalizedRow = { rowId };

  for (const [columnName, value] of Object.entries(values)) {
    const key = toCamelCase(columnName);
    normalized[key] = normalizeValue(value, imageCollector);
  }

  return normalized;
}
