import { test, expect } from "@playwright/test";

test.describe("llm-button", () => {
  test.describe("rendering", () => {
    test("renders with default provider (copilot)", async ({ page }) => {
      await page.goto("/global/button");
      const llm = page.locator("llm-button");
      await expect(llm).toBeVisible();

      const mainButton = llm.locator(".llm-main-button");
      await expect(mainButton).toContainText("Ask GitHub Copilot");
    });

    test("shows provider icon in button", async ({ page }) => {
      await page.goto("/global/button");
      const llm = page.locator("llm-button");
      const svg = llm.locator(".llm-main-button .llm-provider-icon");
      await expect(svg).toBeVisible();
    });
  });

  test.describe("provider selection", () => {
    test("opens dropdown on toggle click", async ({ page }) => {
      await page.goto("/global/button");
      const llm = page.locator("llm-button");

      const toggle = llm.locator(".p-contextual-menu__toggle");
      await toggle.click();

      const dropdown = llm.locator(".p-contextual-menu__dropdown");
      await expect(dropdown).toHaveAttribute("aria-hidden", "false");
    });

    test("shows all three providers in dropdown", async ({ page }) => {
      await page.goto("/global/button");
      const llm = page.locator("llm-button");

      const toggle = llm.locator(".p-contextual-menu__toggle");
      await toggle.click();

      const links = llm.locator(".p-contextual-menu__link");
      await expect(links).toHaveCount(3);
      await expect(links.nth(0)).toContainText("Claude");
      await expect(links.nth(1)).toContainText("ChatGPT");
      await expect(links.nth(2)).toContainText("GitHub Copilot");
    });

    test("highlights current provider in dropdown", async ({ page }) => {
      await page.goto("/global/button");
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      const llm = page.locator("llm-button");
      const toggle = llm.locator(".p-contextual-menu__toggle");
      await toggle.click();

      // Default is copilot (3rd item)
      const copilotLink = llm.locator(".p-contextual-menu__link").nth(2);
      await expect(copilotLink).toHaveClass(/is-selected/);
    });

    test("switches provider on selection", async ({ page }) => {
      await page.goto("/global/button");
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      const llm = page.locator("llm-button");
      const toggle = llm.locator(".p-contextual-menu__toggle");
      await toggle.click();

      // Select Claude
      const claudeLink = llm.locator(".p-contextual-menu__link").nth(0);
      await claudeLink.click();

      const mainButton = llm.locator(".llm-main-button");
      await expect(mainButton).toContainText("Ask Claude");
    });

    test("closes dropdown after selection", async ({ page }) => {
      await page.goto("/global/button");
      const llm = page.locator("llm-button");

      const toggle = llm.locator(".p-contextual-menu__toggle");
      await toggle.click();

      const claudeLink = llm.locator(".p-contextual-menu__link").nth(0);
      await claudeLink.click();

      const dropdown = llm.locator(".p-contextual-menu__dropdown");
      await expect(dropdown).toHaveAttribute("aria-hidden", "true");
    });

    test("closes dropdown on outside click", async ({ page }) => {
      await page.goto("/global/button");
      const llm = page.locator("llm-button");

      const toggle = llm.locator(".p-contextual-menu__toggle");
      await toggle.click();

      const dropdown = llm.locator(".p-contextual-menu__dropdown");
      await expect(dropdown).toHaveAttribute("aria-hidden", "false");

      // Click outside
      await page.locator("body").click({ position: { x: 10, y: 10 } });
      await expect(dropdown).toHaveAttribute("aria-hidden", "true");
    });
  });

  test.describe("localStorage persistence", () => {
    test("persists provider selection to localStorage", async ({ page }) => {
      await page.goto("/global/button");
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      const llm = page.locator("llm-button");
      const toggle = llm.locator(".p-contextual-menu__toggle");
      await toggle.click();

      // Select ChatGPT
      const chatgptLink = llm.locator(".p-contextual-menu__link").nth(1);
      await chatgptLink.click();

      const stored = await page.evaluate(() =>
        localStorage.getItem("llm-provider-preference"),
      );
      expect(stored).toBe("chatgpt");
    });

    test("restores provider from localStorage", async ({ page }) => {
      await page.goto("/global/button");
      await page.evaluate(() =>
        localStorage.setItem("llm-provider-preference", "claude"),
      );
      await page.reload();

      const mainButton = page.locator("llm-button .llm-main-button");
      await expect(mainButton).toContainText("Ask Claude");
    });

    test("falls back to copilot for invalid localStorage value", async ({
      page,
    }) => {
      await page.goto("/global/button");
      await page.evaluate(() =>
        localStorage.setItem("llm-provider-preference", "invalid-provider"),
      );
      await page.reload();

      const mainButton = page.locator("llm-button .llm-main-button");
      await expect(mainButton).toContainText("Ask GitHub Copilot");
    });
  });

  test.describe("URL construction", () => {
    test("opens correct URL for copilot on construct page", async ({
      page,
      context,
    }) => {
      await page.goto("/global/button");
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      // Capture the new tab URL
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        page.locator("llm-button .llm-main-button").click(),
      ]);

      const url = newPage.url();
      expect(url).toContain("github.com/copilot");
      expect(url).toContain("button.json");
      expect(url).toContain("constructs");
      await newPage.close();
    });

    test("opens correct URL for copilot on concept page", async ({
      page,
      context,
    }) => {
      await page.goto("/global/concept/intentional-friction");
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        page.locator("llm-button .llm-main-button").click(),
      ]);

      const url = newPage.url();
      expect(url).toContain("github.com/copilot");
      expect(url).toContain("intentional-friction.json");
      expect(url).toContain("concepts");
      await newPage.close();
    });

    test("opens correct URL for Claude", async ({ page, context }) => {
      await page.goto("/global/button");
      await page.evaluate(() =>
        localStorage.setItem("llm-provider-preference", "claude"),
      );
      await page.reload();

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        page.locator("llm-button .llm-main-button").click(),
      ]);

      const url = newPage.url();
      expect(url).toContain("claude.ai/new");
      expect(url).toContain("button.md");
      await newPage.close();
    });

    test("opens correct URL for ChatGPT", async ({ page, context }) => {
      await page.goto("/global/button");
      await page.evaluate(() =>
        localStorage.setItem("llm-provider-preference", "chatgpt"),
      );
      await page.reload();

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        page.locator("llm-button .llm-main-button").click(),
      ]);

      const url = newPage.url();
      expect(url).toContain("chatgpt.com");
      expect(url).toContain("button.md");
      await newPage.close();
    });
  });
});
