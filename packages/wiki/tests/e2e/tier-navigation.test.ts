import { test, expect } from "@playwright/test";

test.describe("tier navigation", () => {
  test("top navigation shows tier tabs", async ({ page }) => {
    await page.goto("/global/button");

    // Should have links/tabs for Global, Apps, Sites
    const nav = page.locator(".p-navigation__items, .p-navigation__list");
    await expect(nav.locator('a:has-text("Global")')).toBeVisible();
    await expect(nav.locator('a:has-text("Apps")')).toBeVisible();
    await expect(nav.locator('a:has-text("Sites")')).toBeVisible();
  });

  test("clicking Apps tab navigates to apps tier", async ({ page }) => {
    await page.goto("/global/button");

    const nav = page.locator(".p-navigation__items, .p-navigation__list");
    await nav.locator('a:has-text("Apps")').click();
    await page.waitForURL("**/apps/**");
    expect(page.url()).toContain("/apps/");
  });

  test("clicking Sites tab navigates to sites tier", async ({ page }) => {
    await page.goto("/global/button");

    const nav = page.locator(".p-navigation__items, .p-navigation__list");
    await nav.locator('a:has-text("Sites")').click();
    await page.waitForURL("**/sites/**");
    expect(page.url()).toContain("/sites/");
  });

  test("side navigation updates when tier changes", async ({ page }) => {
    await page.goto("/global/button");

    // Navigate to apps tier
    const topNav = page.locator(".p-navigation__items, .p-navigation__list");
    await topNav.locator('a:has-text("Apps")').click();
    await page.waitForURL("**/apps/**");

    // Side nav should have apps-specific items with /apps/ hrefs
    const appsNav = page.locator("side-navigation");
    const appsLinks = appsNav.locator(".p-side-navigation__link");
    expect(await appsLinks.count()).toBeGreaterThan(0);
    await expect(appsLinks.first()).toHaveAttribute("href", /^\/apps\//);
  });
});
