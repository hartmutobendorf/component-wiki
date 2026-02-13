import { describe, it, expect } from "vitest";
import { handleApiResponse } from "../../src/coda/utils";

describe("handleApiResponse", () => {
  it("returns data on success", async () => {
    const result = await handleApiResponse(
      { data: { items: [1, 2, 3] } },
      "Fetch failed"
    );
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it("throws on error with formatted message", async () => {
    const error = { statusCode: 404, message: "Not found" };
    await expect(
      handleApiResponse({ error }, "Table fetch failed")
    ).rejects.toThrow("Table fetch failed");
  });

  it("includes error details in thrown message", async () => {
    const error = { statusCode: 401, message: "Unauthorized" };
    await expect(
      handleApiResponse({ error }, "API error")
    ).rejects.toThrow("Unauthorized");
  });

  it("returns data even when it is falsy (but not error)", async () => {
    const result = await handleApiResponse(
      { data: 0 as unknown },
      "Fail"
    );
    expect(result).toBe(0);
  });
});
