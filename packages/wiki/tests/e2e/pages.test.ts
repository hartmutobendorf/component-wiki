import { test, expect } from "@playwright/test";

test.describe("page rendering", () => {
  test.describe("index redirects", () => {
    test("/ redirects to /global", async ({ page }) => {
      await page.goto("/");
      await page.waitForURL("**/global/**");
      expect(page.url()).toContain("/global/");
    });

    test("/global/ redirects to first item", async ({ page }) => {
      await page.goto("/global/");
      await page.waitForURL(/\/global\/.+/);
      expect(page.url()).toMatch(/\/global\/.+/);
    });

    test("/apps/ redirects to first item", async ({ page }) => {
      await page.goto("/apps/");
      await page.waitForURL(/\/apps\/.+/);
      expect(page.url()).toMatch(/\/apps\/.+/);
    });

    test("/sites/ redirects to first item", async ({ page }) => {
      await page.goto("/sites/");
      await page.waitForURL(/\/sites\/.+/);
      expect(page.url()).toMatch(/\/sites\/.+/);
    });
  });

  test.describe("construct page", () => {
    test("renders title", async ({ page }) => {
      await page.goto("/global/button");
      const title = page.locator("h1");
      await expect(title).toContainText("Button");
    });

    test("renders metadata block", async ({ page }) => {
      await page.goto("/global/button");
      const metadata = page.locator(".wiki-metadata-list");
      await expect(metadata).toBeVisible();
      await expect(metadata).toContainText("Component");
      await expect(metadata).toContainText("Global");
    });

    test("renders side navigation", async ({ page }) => {
      await page.goto("/global/button");
      await expect(page.locator("side-navigation")).toBeVisible();
    });

    test("renders top navigation with tier tabs", async ({ page }) => {
      await page.goto("/global/button");
      const topNav = page.locator("nav.p-navigation, .p-navigation");
      await expect(topNav).toBeVisible();
    });
  });

  test.describe("concept page", () => {
    test("renders title", async ({ page }) => {
      await page.goto("/global/concept/intentional-friction");
      const title = page.locator("h1");
      await expect(title).toContainText("Intentional friction");
    });

    test("renders metadata block", async ({ page }) => {
      await page.goto("/global/concept/intentional-friction");
      const metadata = page.locator(".wiki-metadata-list");
      await expect(metadata).toBeVisible();
      await expect(metadata).toContainText("Decision guide");
      await expect(metadata).toContainText("Global");
    });
  });

  test.describe("404 page", () => {
    test("returns 404 for invalid route", async ({ page }) => {
      const response = await page.goto("/global/nonexistent-component-xyz");
      expect(response?.status()).toBe(404);
    });

    test("shows 404 content", async ({ page }) => {
      await page.goto("/global/nonexistent-component-xyz");
      await expect(page.locator("body")).toContainText(/not found|404/i);
    });
  });
});
