import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAllRows, fetchAllTables } from "../../src/api/fetchers";
import type { CodaServices } from "../../src/coda/services";
import type { SyncConfig } from "../../src/config";
import {
  paginatedResponsePage1,
  paginatedResponsePage2,
} from "../fixtures/sample-rows";

function createMockServices(responses: unknown[]): CodaServices {
  const getTableRows = vi.fn();
  for (const response of responses) {
    getTableRows.mockResolvedValueOnce(response);
  }
  return {
    getTableRows,
    exportPageContent: vi.fn(),
  } as unknown as CodaServices;
}

describe("fetchAllRows", () => {
  it("fetches a single page of results", async () => {
    const services = createMockServices([paginatedResponsePage2]);

    const rows = await fetchAllRows(services, "dFakeDoc99", "grid-comp01");
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("i-comp03");
    expect(rows[0].name).toBe("Dropdown");
  });

  it("handles pagination across multiple pages", async () => {
    const services = createMockServices([
      paginatedResponsePage1,
      paginatedResponsePage2,
    ]);

    const rows = await fetchAllRows(services, "dFakeDoc99", "grid-comp01");

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.id)).toEqual([
      "i-abc123def4",
      "i-comp02",
      "i-comp03",
    ]);
  });

  it("passes correct options to getTableRows", async () => {
    const services = createMockServices([{ items: [] }]);

    await fetchAllRows(services, "dFakeDoc99", "grid-comp01");

    expect(services.getTableRows).toHaveBeenCalledWith(
      "dFakeDoc99",
      "grid-comp01",
      {
        useColumnNames: true,
        valueFormat: "rich",
        limit: 200,
        pageToken: undefined,
      }
    );
  });

  it("passes pageToken on subsequent requests", async () => {
    const services = createMockServices([
      paginatedResponsePage1,
      paginatedResponsePage2,
    ]);

    await fetchAllRows(services, "dFakeDoc99", "grid-comp01");

    expect(services.getTableRows).toHaveBeenCalledTimes(2);
    expect(services.getTableRows).toHaveBeenNthCalledWith(
      2,
      "dFakeDoc99",
      "grid-comp01",
      expect.objectContaining({
        pageToken: "eyJsaW1pdCI6MiwidG9rZW4iOiJwYWdlMiJ9",
      })
    );
  });

  it("returns empty array when no items", async () => {
    const services = createMockServices([{ items: [] }]);
    const rows = await fetchAllRows(services, "dFakeDoc99", "grid-comp01");
    expect(rows).toEqual([]);
  });

  it("handles missing items field gracefully", async () => {
    const services = createMockServices([{}]);
    const rows = await fetchAllRows(services, "dFakeDoc99", "grid-comp01");
    expect(rows).toEqual([]);
  });
});

describe("fetchAllTables", () => {
  const config: SyncConfig = {
    baseUrl: "https://coda.io/apis/v1",
    docId: "dFakeDoc99",
    tables: {
      components: { id: "grid-comp01" },
      properties: { id: "grid-props", relatesTo: "components" },
    },
  };

  it("fetches all tables and returns a name → rows map", async () => {
    const services = createMockServices([
      {
        items: [
          {
            id: "i-abc123def4",
            name: "Toggle switch",
            values: { Name: "```Toggle switch```" },
          },
        ],
      },
      {
        items: [
          {
            id: "i-prop55xyz",
            name: "Disabled",
            values: { Name: "```Disabled```" },
          },
        ],
      },
    ]);

    const result = await fetchAllTables(services, "dFakeDoc99", config);

    expect(Object.keys(result)).toContain("components");
    expect(Object.keys(result)).toContain("properties");
    expect(result.components).toHaveLength(1);
    expect(result.properties).toHaveLength(1);
  });

  it("fetches tables in parallel", async () => {
    let callCount = 0;
    const getTableRows = vi.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 10));
      return {
        items: [{ id: `i-r${callCount}`, name: "X", values: {} }],
      };
    });

    const services = {
      getTableRows,
      exportPageContent: vi.fn(),
    } as unknown as CodaServices;

    const result = await fetchAllTables(services, "dFakeDoc99", config);
    expect(getTableRows).toHaveBeenCalledTimes(2);
    expect(Object.keys(result)).toHaveLength(2);
  });
});
