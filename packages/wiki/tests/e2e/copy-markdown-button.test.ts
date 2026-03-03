import { test, expect } from "@playwright/test";

test.describe("copy-markdown-button", () => {
  test("renders with default button text", async ({ page }) => {
    await page.goto("/global/button");
    const button = page.locator("copy-markdown-button");
    await expect(button).toBeVisible();
    await expect(button.locator("button")).toContainText("Copy page as markdown");
  });

  test("shows loading state during fetch", async ({ page }) => {
    // Intercept the .md request and delay it
    await page.route("**/global/button.md", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({ body: "# Button\nMarkdown content", contentType: "text/plain" });
    });

    await page.goto("/global/button");

    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const button = page.locator("copy-markdown-button");
    const innerButton = button.locator("button");

    await innerButton.click();
    await expect(innerButton).toContainText("Loading...");
    await expect(innerButton).toBeDisabled();
  });

  test("copies markdown and shows success state", async ({ page }) => {
    await page.route("**/global/button.md", async (route) => {
      await route.fulfill({ body: "# Button\nTest markdown", contentType: "text/plain" });
    });

    await page.goto("/global/button");
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const button = page.locator("copy-markdown-button");
    const innerButton = button.locator("button");

    await innerButton.click();
    await expect(innerButton).toContainText("Copied!");

    // Verify clipboard content
    const clipboardContent = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardContent).toBe("# Button\nTest markdown");
  });

  test("reverts to idle after success", async ({ page }) => {
    await page.route("**/global/button.md", async (route) => {
      await route.fulfill({ body: "# Button", contentType: "text/plain" });
    });

    await page.goto("/global/button");
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const innerButton = page.locator("copy-markdown-button button");
    await innerButton.click();
    await expect(innerButton).toContainText("Copied!");

    // Wait for timeout revert (2 seconds)
    await expect(innerButton).toContainText("Copy page as markdown", {
      timeout: 3000,
    });
  });

  test("shows error state on fetch failure", async ({ page }) => {
    await page.route("**/global/button.md", (route) =>
      route.fulfill({ status: 500, body: "Server Error" }),
    );

    await page.goto("/global/button");
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const innerButton = page.locator("copy-markdown-button button");
    await innerButton.click();
    await expect(innerButton).toContainText("Failed to copy");
  });

  test("prevents double-click during loading", async ({ page }) => {
    let requestCount = 0;
    await page.route("**/global/button.md", async (route) => {
      requestCount++;
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({ body: "# Button", contentType: "text/plain" });
    });

    await page.goto("/global/button");
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const innerButton = page.locator("copy-markdown-button button");
    await innerButton.click();
    await innerButton.click({ force: true }); // Force click even if disabled

    // Should only have triggered one fetch
    expect(requestCount).toBe(1);
  });
});
