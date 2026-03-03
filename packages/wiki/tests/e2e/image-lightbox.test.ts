import { test, expect } from "@playwright/test";

test.describe("image-lightbox", () => {
  test("renders slotted image content", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();
    await expect(lightbox).toBeVisible();

    // The slotted image should be visible
    const img = lightbox.locator("img");
    await expect(img).toBeVisible();
  });

  test("opens dialog on image click", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();
    const img = lightbox.locator("img");

    await img.click();

    // The dialog inside the shadow DOM should be open
    const dialog = lightbox.locator("dialog");
    await expect(dialog).toHaveAttribute("open", "");
  });

  test("shows full-size image in dialog", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();
    const img = lightbox.locator("img").first();

    const originalSrc = await img.getAttribute("src");
    await img.click();

    // The dialog should contain an img with the same src
    // Note: the dialog img src may be absolute (resolved from DOM property)
    const dialogImg = lightbox.locator("dialog img");
    await expect(dialogImg).toBeVisible();
    const dialogSrc = await dialogImg.getAttribute("src");
    expect(dialogSrc).toContain(originalSrc!);
  });

  test("closes dialog on click", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();
    const img = lightbox.locator("img").first();

    await img.click();
    const dialog = lightbox.locator("dialog");
    await expect(dialog).toHaveAttribute("open", "");

    // Click the dialog to close
    await dialog.click({ position: { x: 5, y: 5 } });
    await expect(dialog).not.toHaveAttribute("open", "");
  });

  test("closes dialog on Escape key", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();
    const img = lightbox.locator("img").first();

    await img.click();
    const dialog = lightbox.locator("dialog");
    await expect(dialog).toHaveAttribute("open", "");

    await page.keyboard.press("Escape");
    await expect(dialog).not.toHaveAttribute("open", "");
  });

  test("does not open dialog when clicking non-image content", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();

    // Click the lightbox wrapper but not on the image
    // Use dispatchEvent to click the host element's slot wrapper
    await lightbox.evaluate((el) => {
      const div = el.shadowRoot?.querySelector("div");
      div?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    });

    const dialog = lightbox.locator("dialog");
    await expect(dialog).not.toHaveAttribute("open", "");
  });
});
