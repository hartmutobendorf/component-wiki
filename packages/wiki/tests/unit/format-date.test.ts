import { describe, it, expect } from "vitest";
import { formatDate } from "../../src/utils/format-date.js";

describe("formatDate", () => {
  // ── Short format (default) ──────────────────────────────

  it("formats a date in short format by default", () => {
    const result = formatDate("2024-06-15T00:00:00Z");
    expect(result).toBe("15/06/2024");
  });

  it("formats a date in short format explicitly", () => {
    const result = formatDate("2024-01-03T00:00:00Z", "short");
    expect(result).toBe("03/01/2024");
  });

  it("pads single-digit days and months", () => {
    const result = formatDate("2024-02-05T00:00:00Z", "short");
    expect(result).toBe("05/02/2024");
  });

  // ── Long format ─────────────────────────────────────────

  it("formats a date in long format", () => {
    const result = formatDate("2024-06-15T00:00:00Z", "long");
    expect(result).toBe("15 Jun 2024");
  });

  it("formats January in long format", () => {
    const result = formatDate("2024-01-03T00:00:00Z", "long");
    expect(result).toBe("3 Jan 2024");
  });

  // ── Edge cases ──────────────────────────────────────────

  it("handles ISO date strings without time", () => {
    // Note: dates without timezone may be interpreted as local time
    const result = formatDate("2024-06-15");
    expect(result).toMatch(/\d{2}\/\d{2}\/2024/);
  });

  it("handles end-of-year dates", () => {
    const result = formatDate("2024-12-31T00:00:00Z", "short");
    expect(result).toBe("31/12/2024");
  });
});
