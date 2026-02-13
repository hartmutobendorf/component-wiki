import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractHtmlColumns } from "../../src/html/export";
import type { CodaServices } from "../../src/coda/services";
import type { TableConfig } from "../../src/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureHtml = readFileSync(
  resolve(__dirname, "../fixtures/html-export.html"),
  "utf-8"
);

function createMockServices(html: string): CodaServices {
  return {
    exportPageContent: vi.fn().mockResolvedValue(html),
    getTableRows: vi.fn(),
  } as unknown as CodaServices;
}

describe("extractHtmlColumns", () => {
  let services: CodaServices;

  beforeEach(() => {
    services = createMockServices(fixtureHtml);
  });

  it("extracts specified HTML columns for each named row", async () => {
    const config: TableConfig = {
      id: "grid-comp01",
      pageId: "canvas-fake01",
      htmlColumns: ["Usage", "Examples"],
    };

    const result = await extractHtmlColumns(services, "dFakeDoc99", config);

    expect(result.size).toBe(2); // Toggle switch and Slider (empty name row skipped)
    expect(result.has("Toggle switch")).toBe(true);
    expect(result.has("Slider")).toBe(true);
  });

  it("extracts correct HTML content for Toggle switch Usage", async () => {
    const config: TableConfig = {
      id: "grid-comp01",
      pageId: "canvas-fake01",
      htmlColumns: ["Usage"],
    };

    const result = await extractHtmlColumns(services, "dFakeDoc99", config);
    const toggleUsage = result.get("Toggle switch")?.["Usage"] || "";

    expect(toggleUsage).toContain("font-weight: bold;");
    expect(toggleUsage).toContain("Toggle switch");
    expect(toggleUsage).toContain("font-style: italic;");
    expect(toggleUsage).toContain("two states");
  });

  it("extracts Examples column with inline images", async () => {
    const config: TableConfig = {
      id: "grid-comp01",
      pageId: "canvas-fake01",
      htmlColumns: ["Examples"],
    };

    const result = await extractHtmlColumns(services, "dFakeDoc99", config);
    const toggleExamples = result.get("Toggle switch")?.["Examples"] || "";

    expect(toggleExamples).toContain("instant settings");
    expect(toggleExamples).toContain("bl-toggle-usage.png");
  });

  it("skips rows with empty names", async () => {
    const config: TableConfig = {
      id: "grid-comp01",
      pageId: "canvas-fake01",
      htmlColumns: ["Usage"],
    };

    const result = await extractHtmlColumns(services, "dFakeDoc99", config);
    expect(result.size).toBe(2);
  });

  it("returns empty map when no htmlColumns specified", async () => {
    const config: TableConfig = {
      id: "grid-comp01",
      pageId: "canvas-fake01",
      htmlColumns: [],
    };

    const result = await extractHtmlColumns(services, "dFakeDoc99", config);
    expect(result.size).toBe(0);
  });

  it("throws when pageId is missing", async () => {
    const config: TableConfig = {
      id: "grid-comp01",
      htmlColumns: ["Usage"],
    };

    await expect(
      extractHtmlColumns(services, "dFakeDoc99", config)
    ).rejects.toThrow("pageId is required");
  });

  it("handles missing columns gracefully", async () => {
    const config: TableConfig = {
      id: "grid-comp01",
      pageId: "canvas-fake01",
      htmlColumns: ["NonExistentColumn"],
    };

    const result = await extractHtmlColumns(services, "dFakeDoc99", config);
    for (const [, columns] of result) {
      expect(columns["NonExistentColumn"]).toBeUndefined();
    }
  });

  it("handles HTML with no table", async () => {
    const noTableServices = createMockServices(
      "<html><body><p>No table here</p></body></html>"
    );
    const config: TableConfig = {
      id: "grid-comp01",
      pageId: "canvas-fake01",
      htmlColumns: ["Usage"],
    };

    const result = await extractHtmlColumns(
      noTableServices,
      "dFakeDoc99",
      config
    );
    expect(result.size).toBe(0);
  });

  it("calls exportPageContent with correct arguments", async () => {
    const config: TableConfig = {
      id: "grid-comp01",
      pageId: "canvas-fake01",
      htmlColumns: ["Usage"],
    };

    await extractHtmlColumns(services, "dFakeDoc99", config);

    expect(services.exportPageContent).toHaveBeenCalledWith(
      "dFakeDoc99",
      "canvas-fake01",
      "html"
    );
  });

  it("only extracts requested columns, ignores others", async () => {
    const config: TableConfig = {
      id: "grid-comp01",
      pageId: "canvas-fake01",
      htmlColumns: ["Examples"],
    };

    const result = await extractHtmlColumns(services, "dFakeDoc99", config);
    const toggle = result.get("Toggle switch");
    expect(toggle).toBeDefined();
    expect(toggle!["Examples"]).toBeDefined();
    expect(toggle!["Usage"]).toBeUndefined();
    expect(toggle!["Description"]).toBeUndefined();
  });
});
