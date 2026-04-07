/**
 * Formats a date string consistently across the application.
 *
 * Uses "de-DE" locale for dot-separated dates:
 * - "short" → "03.03.2026" (DD.MM.YYYY)
 * - "long"  → "3. März 2026"
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
    return d.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // "short" — DD.MM.YYYY
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
