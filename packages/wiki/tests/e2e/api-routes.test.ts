import { test, expect } from "@playwright/test";

test.describe("API routes", () => {
  test.describe("construct JSON", () => {
    test("GET /global/button.json returns valid JSON", async ({ request }) => {
      const response = await request.get("/global/button.json");
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");

      const data = await response.json();
      expect(data.name).toBe("Button");
      expect(data.slug).toBe("button");
      expect(data.type).toBe("Component");
    });

    test("JSON contains expected construct fields", async ({ request }) => {
      const response = await request.get("/global/button.json");
      const data = await response.json();

      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("slug");
      expect(data).toHaveProperty("type");
      expect(data).toHaveProperty("tier");
      expect(data).toHaveProperty("documentationStatus");
      expect(data).toHaveProperty("lastEdited");
    });
  });

  test.describe("construct markdown", () => {
    test("GET /global/button.md returns markdown", async ({ request }) => {
      const response = await request.get("/global/button.md");
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toMatch(/text\/(plain|markdown)/);

      const text = await response.text();
      expect(text).toContain("# Button");
      expect(text).toContain("Component");
    });

    test("markdown contains metadata section", async ({ request }) => {
      const response = await request.get("/global/button.md");
      const text = await response.text();

      expect(text).toMatch(/\*\*Type:\*\*/);
      expect(text).toMatch(/\*\*Tier:\*\*/);
    });
  });

  test.describe("concept JSON", () => {
    test("GET /global/concept/intentional-friction.json returns valid JSON", async ({
      request,
    }) => {
      const response = await request.get(
        "/global/concept/intentional-friction.json",
      );
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");

      const data = await response.json();
      expect(data.name).toBe("Intentional friction");
      expect(data.slug).toBe("intentional-friction");
    });

    test("JSON contains expected concept fields", async ({ request }) => {
      const response = await request.get(
        "/global/concept/intentional-friction.json",
      );
      const data = await response.json();

      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("slug");
      expect(data).toHaveProperty("type");
      expect(data).toHaveProperty("tier");
      expect(data).toHaveProperty("documentationStatus");
    });
  });

  test.describe("concept markdown", () => {
    test("GET /global/concept/intentional-friction.md returns markdown", async ({
      request,
    }) => {
      const response = await request.get(
        "/global/concept/intentional-friction.md",
      );
      expect(response.status()).toBe(200);

      const text = await response.text();
      expect(text).toContain("# Intentional friction");
      expect(text).toContain("Decision guide");
    });
  });

  test.describe("figma endpoint", () => {
    test("GET /figma/button returns HTML", async ({ request }) => {
      const response = await request.get("/figma/button");
      expect(response.status()).toBe(200);

      const text = await response.text();
      expect(text.length).toBeGreaterThan(0);
      // Figma paste data contains metadata markers
      expect(text).toContain("figmeta");
    });

    test("GET /figma/nonexistent returns 404", async ({ request }) => {
      const response = await request.get("/figma/nonexistent-xyz");
      expect(response.status()).toBe(404);
    });
  });
});
