import { test, expect } from "@playwright/test";

test.describe("copy-figma-button", () => {
  test("renders with configured button text", async ({ page }) => {
    await page.goto("/global/button");
    const button = page.locator("copy-figma-button");
    await expect(button).toBeVisible();
    await expect(button.locator("button")).toContainText(
      "Copy as Figma component",
    );
  });

  test("preloads data from /figma/{id} on page load", async ({ page }) => {
    let figmaRequested = false;
    await page.route("**/figma/button", (route) => {
      figmaRequested = true;
      return route.fulfill({
        body: '<div class="figma-component">Button</div>',
        contentType: "text/html",
      });
    });

    await page.goto("/global/button");
    // Wait for the preload request to complete
    await page.waitForTimeout(500);
    expect(figmaRequested).toBe(true);
  });

  test("copies HTML to clipboard on click", async ({ page }) => {
    await page.route("**/figma/button", (route) =>
      route.fulfill({
        body: '<div class="figma-component">Button</div>',
        contentType: "text/html",
      }),
    );

    await page.goto("/global/button");
    await page.context().grantPermissions([
      "clipboard-read",
      "clipboard-write",
    ]);

    // Wait for preload to complete
    await page.waitForTimeout(500);

    const innerButton = page.locator("copy-figma-button button");
    await innerButton.click();
    await expect(innerButton).toContainText("Copied!");
  });

  test("shows no-data state when preload failed", async ({ page }) => {
    await page.route("**/figma/button", (route) =>
      route.fulfill({ status: 404, body: "Not Found" }),
    );

    await page.goto("/global/button");
    await page.context().grantPermissions([
      "clipboard-read",
      "clipboard-write",
    ]);

    // Wait for preload to fail
    await page.waitForTimeout(500);

    const innerButton = page.locator("copy-figma-button button");
    await innerButton.click();
    await expect(innerButton).toContainText("No data available");
  });

  test("reverts to idle after success", async ({ page }) => {
    await page.route("**/figma/button", (route) =>
      route.fulfill({
        body: '<div class="figma-component">Button</div>',
        contentType: "text/html",
      }),
    );

    await page.goto("/global/button");
    await page.context().grantPermissions([
      "clipboard-read",
      "clipboard-write",
    ]);

    await page.waitForTimeout(500);

    const innerButton = page.locator("copy-figma-button button");
    await innerButton.click();
    await expect(innerButton).toContainText("Copied!");
    await expect(innerButton).toContainText("Copy as Figma component", {
      timeout: 3000,
    });
  });
});
