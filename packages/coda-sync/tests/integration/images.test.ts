import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectedImage } from "../../src/api/normalize";

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { downloadAllImages } = await import("../../src/html/images");

function createFetchResponse(
  body: ArrayBuffer = new ArrayBuffer(8),
  headers: Record<string, string> = {}
): Response {
  return {
    arrayBuffer: () => Promise.resolve(body),
    headers: {
      get: (key: string) => headers[key] || null,
    },
  } as unknown as Response;
}

describe("downloadAllImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(createFetchResponse());
  });

  it("downloads images from ImageCollector with pre-assigned paths", async () => {
    const collected: CollectedImage[] = [
      { url: "https://cdn.example.com/a.png", localPath: "images/uuid-a.png" },
      { url: "https://cdn.example.com/b.jpg", localPath: "images/uuid-b.jpg" },
    ];

    const result = await downloadAllImages(collected, [], "/tmp/images");

    expect(result.size).toBe(2);
    expect(result.get("https://cdn.example.com/a.png")).toBe("images/uuid-a.png");
    expect(result.get("https://cdn.example.com/b.jpg")).toBe("images/uuid-b.jpg");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("downloads HTML inline images and assigns UUID paths", async () => {
    const htmlUrls = ["https://cdn.example.com/inline.png"];

    const result = await downloadAllImages([], htmlUrls, "/tmp/images");

    expect(result.size).toBe(1);
    const path = result.get("https://cdn.example.com/inline.png");
    expect(path).toBeDefined();
    expect(path).toMatch(/^images\/[\w-]+\.\w+$/);
  });

  it("deduplicates URLs across collector and HTML images", async () => {
    const collected: CollectedImage[] = [
      { url: "https://cdn.example.com/shared.png", localPath: "images/uuid-shared.png" },
    ];
    const htmlUrls = ["https://cdn.example.com/shared.png"];

    const result = await downloadAllImages(collected, htmlUrls, "/tmp/images");

    // Should only download once — collector takes precedence
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.get("https://cdn.example.com/shared.png")).toBe(
      "images/uuid-shared.png"
    );
  });

  it("deduplicates within HTML image URLs", async () => {
    const htmlUrls = [
      "https://cdn.example.com/dup.png",
      "https://cdn.example.com/dup.png",
    ];

    await downloadAllImages([], htmlUrls, "/tmp/images");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("handles download failures gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const collected: CollectedImage[] = [
      { url: "https://cdn.example.com/fail.png", localPath: "images/fail.png" },
    ];

    const result = await downloadAllImages(collected, [], "/tmp/images");
    expect(result.has("https://cdn.example.com/fail.png")).toBe(false);
  });

  it("continues downloading other images when one fails", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(createFetchResponse());

    const collected: CollectedImage[] = [
      { url: "https://cdn.example.com/fail.png", localPath: "images/fail.png" },
      { url: "https://cdn.example.com/ok.png", localPath: "images/ok.png" },
    ];

    const result = await downloadAllImages(collected, [], "/tmp/images");
    expect(result.has("https://cdn.example.com/fail.png")).toBe(false);
    expect(result.get("https://cdn.example.com/ok.png")).toBe("images/ok.png");
  });

  it("skips empty URLs from collector", async () => {
    const collected: CollectedImage[] = [
      { url: "", localPath: "images/empty.png" },
    ];

    const result = await downloadAllImages(collected, [], "/tmp/images");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it("skips empty URLs from HTML", async () => {
    const result = await downloadAllImages([], [""], "/tmp/images");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it("creates output directory", async () => {
    const { mkdir } = await import("node:fs/promises");
    await downloadAllImages([], [], "/tmp/test-images");
    expect(mkdir).toHaveBeenCalledWith("/tmp/test-images", { recursive: true });
  });

  it("uses extension from x-amz-meta-filename header for HTML images", async () => {
    mockFetch.mockResolvedValueOnce(
      createFetchResponse(new ArrayBuffer(8), {
        "x-amz-meta-filename": "photo.webp",
      })
    );

    const result = await downloadAllImages(
      [],
      ["https://cdn.example.com/no-ext"],
      "/tmp/images"
    );

    const path = result.get("https://cdn.example.com/no-ext");
    expect(path).toMatch(/\.webp$/);
  });
});
