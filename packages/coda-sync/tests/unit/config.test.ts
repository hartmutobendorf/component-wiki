import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";

// Mock fs so loadConfig reads our test data instead of real file
vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
}));

const mockedReadFileSync = vi.mocked(readFileSync);

// Import after mock setup
const { loadConfig, getApiToken } = await import("../../src/config");

const validConfig = {
  baseUrl: "https://coda.io/apis/v1",
  docId: "doc-123",
  tables: {
    components: { id: "grid-abc" },
  },
};

describe("loadConfig", () => {
  beforeEach(() => {
    mockedReadFileSync.mockReturnValue(JSON.stringify(validConfig));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and returns a valid config", () => {
    const config = loadConfig();
    expect(config.baseUrl).toBe("https://coda.io/apis/v1");
    expect(config.docId).toBe("doc-123");
    expect(config.tables.components.id).toBe("grid-abc");
  });

  it("throws when baseUrl is missing", () => {
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ ...validConfig, baseUrl: "" })
    );
    expect(() => loadConfig()).toThrow("missing baseUrl");
  });

  it("throws when docId is missing", () => {
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ ...validConfig, docId: "" })
    );
    expect(() => loadConfig()).toThrow("missing docId");
  });

  it("throws when tables is empty", () => {
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ ...validConfig, tables: {} })
    );
    expect(() => loadConfig()).toThrow("missing tables");
  });

  it("throws when tables is missing entirely", () => {
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ baseUrl: "x", docId: "y" })
    );
    expect(() => loadConfig()).toThrow("missing tables");
  });

  it("throws when a table is missing its id", () => {
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        ...validConfig,
        tables: { components: { pageId: "page-1" } },
      })
    );
    expect(() => loadConfig()).toThrow('table "components" missing id');
  });
});

describe("getApiToken", () => {
  const originalEnv = process.env.CODA_API_TOKEN;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.CODA_API_TOKEN = originalEnv;
    } else {
      delete process.env.CODA_API_TOKEN;
    }
  });

  it("returns the token when set", () => {
    process.env.CODA_API_TOKEN = "test-token-abc";
    expect(getApiToken()).toBe("test-token-abc");
  });

  it("throws when CODA_API_TOKEN is not set", () => {
    delete process.env.CODA_API_TOKEN;
    expect(() => getApiToken()).toThrow("CODA_API_TOKEN");
  });
});
