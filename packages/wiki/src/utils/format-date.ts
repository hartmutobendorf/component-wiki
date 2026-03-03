/**
 * Formats a date string consistently across the application.
 *
 * Standardizes on "en-GB" locale:
 * - "short" → "03/03/2026" (DD/MM/YYYY)
 * - "long"  → "3 Mar 2026"
 *
 * @param date - ISO date string or any value accepted by `new Date()`
 * @param style - "short" for tabular/compact display, "long" for prose
 */
export function formatDate(
  date: string,
  style: "short" | "long" = "short",
): string {
  const d = new Date(date);

  if (style === "long") {
    return d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // "short" — DD/MM/YYYY
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
