import { test, expect } from "@playwright/test";

test.describe("side-navigation", () => {
  test.describe("rendering", () => {
    test("renders navigation sections and groups", async ({ page }) => {
      await page.goto("/global/button");
      const nav = page.locator("side-navigation");
      await expect(nav).toBeVisible();

      // Should have Concept and Construct section headings
      const headings = nav.locator(".p-side-navigation__heading");
      await expect(headings).toHaveCount(2);
      await expect(headings.nth(0)).toContainText("Concept");
      await expect(headings.nth(1)).toContainText("Construct");
    });

    test("renders navigation items as links", async ({ page }) => {
      await page.goto("/global/button");
      const nav = page.locator("side-navigation");

      const links = nav.locator(".p-side-navigation__link");
      const count = await links.count();
      expect(count).toBeGreaterThan(0);

      // Each link should have an href
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(links.nth(i)).toHaveAttribute("href", /^\//);
      }
    });

    test("shows empty message when no navigation data", async ({ page }) => {
      // Create a page with empty nav data to test the empty state
      await page.goto("/global/button");
      const nav = page.locator("side-navigation");

      // Inject empty nav-data via JS
      await nav.evaluate((el) => el.setAttribute("nav-data", '{"sections":[]}'));
      await page.waitForTimeout(100); // Allow Lit re-render

      await expect(nav.locator(".wiki-side-nav-empty")).toContainText(
        "No navigation items available",
      );
    });
  });

  test.describe("current page highlighting", () => {
    test("marks current page link as active", async ({ page }) => {
      await page.goto("/global/button");
      const nav = page.locator("side-navigation");

      const activeLink = nav.locator(".p-side-navigation__link.is-active");
      await expect(activeLink).toHaveCount(1);
      await expect(activeLink).toContainText("Button");
      await expect(activeLink).toHaveAttribute("href", "/global/button");
    });

    test("updates active link when navigating", async ({ page }) => {
      await page.goto("/global/button");
      const nav = page.locator("side-navigation");

      // Navigate to another page
      await nav.locator('.p-side-navigation__link[href="/global/checkbox"]').click();
      await page.waitForURL("**/global/checkbox");

      const activeLink = nav.locator(".p-side-navigation__link.is-active");
      await expect(activeLink).toHaveCount(1);
      await expect(activeLink).toContainText("Checkbox");
    });
  });

  test.describe("accordion expand/collapse", () => {
    test("accordion groups are expanded by default", async ({ page }) => {
      await page.goto("/global/button");
      const nav = page.locator("side-navigation");

      const accordionButtons = nav.locator(
        ".p-side-navigation__accordion-button",
      );
      const count = await accordionButtons.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        await expect(accordionButtons.nth(i)).toHaveAttribute(
          "aria-expanded",
          "true",
        );
      }
    });

    test("clicking accordion button collapses the group", async ({ page }) => {
      // Clear sessionStorage to start fresh
      await page.goto("/global/button");
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();

      const nav = page.locator("side-navigation");
      const firstAccordion = nav
        .locator(".p-side-navigation__accordion-button")
        .first();

      await expect(firstAccordion).toHaveAttribute("aria-expanded", "true");
      await firstAccordion.click();
      await expect(firstAccordion).toHaveAttribute("aria-expanded", "false");

      // The sibling list should also be collapsed
      const siblingList = firstAccordion
        .locator("~ .p-side-navigation__list");
      await expect(siblingList).toHaveAttribute("aria-expanded", "false");
    });

    test("clicking collapsed accordion expands it", async ({ page }) => {
      await page.goto("/global/button");
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();

      const nav = page.locator("side-navigation");
      const firstAccordion = nav
        .locator(".p-side-navigation__accordion-button")
        .first();

      // Collapse then expand
      await firstAccordion.click();
      await expect(firstAccordion).toHaveAttribute("aria-expanded", "false");
      await firstAccordion.click();
      await expect(firstAccordion).toHaveAttribute("aria-expanded", "true");
    });

    test("persists collapsed state across navigation", async ({ page }) => {
      await page.goto("/global/button");
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();

      const nav = page.locator("side-navigation");

      // Collapse the first accordion group
      const firstAccordion = nav
        .locator(".p-side-navigation__accordion-button")
        .first();
      await firstAccordion.click();
      await expect(firstAccordion).toHaveAttribute("aria-expanded", "false");

      // Navigate to another page
      await nav.locator('.p-side-navigation__link[href="/global/checkbox"]').click();
      await page.waitForURL("**/global/checkbox");

      // The first accordion should still be collapsed
      const newFirstAccordion = page
        .locator("side-navigation")
        .locator(".p-side-navigation__accordion-button")
        .first();
      await expect(newFirstAccordion).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });

  test.describe("mobile drawer", () => {
    test.use({ viewport: { width: 480, height: 800 } });

    test("shows toggle button on mobile", async ({ page }) => {
      await page.goto("/global/button");
      const nav = page.locator("side-navigation");
      const toggle = nav.locator(".p-side-navigation__toggle");
      await expect(toggle).toBeVisible();
    });

    test("opens drawer on toggle click", async ({ page }) => {
      await page.goto("/global/button");
      const nav = page.locator("side-navigation");
      const toggle = nav.locator(".p-side-navigation__toggle");

      await toggle.click();

      const container = nav.locator(".p-side-navigation--accordion");
      await expect(container).toHaveClass(/is-drawer-expanded/);
    });

    test("closes drawer on Escape key", async ({ page }) => {
      await page.goto("/global/button");
      const nav = page.locator("side-navigation");
      const toggle = nav.locator(".p-side-navigation__toggle");

      await toggle.click();
      const container = nav.locator(".p-side-navigation--accordion");
      await expect(container).toHaveClass(/is-drawer-expanded/);

      await page.keyboard.press("Escape");
      await expect(container).toHaveClass(/is-drawer-collapsed/);
    });
  });
});
