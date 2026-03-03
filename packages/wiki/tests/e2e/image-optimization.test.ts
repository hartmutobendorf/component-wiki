import { test, expect } from "@playwright/test";

test.describe("image optimization", () => {
  test("construct page example image is WebP", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();
    const img = lightbox.locator("img");
    const src = await img.getAttribute("src");
    expect(src).toMatch(/\/_astro\/.*\.webp$/);
  });

  test("construct page anatomy image is WebP", async ({ page }) => {
    await page.goto("/global/button");
    const anatomyImg = page.locator(".wiki-image-contain");
    if ((await anatomyImg.count()) > 0) {
      const src = await anatomyImg.getAttribute("src");
      expect(src).toMatch(/\/_astro\/.*\.webp$/);
    }
  });

  test("images have width and height attributes", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();
    const img = lightbox.locator("img");
    const width = await img.getAttribute("width");
    const height = await img.getAttribute("height");
    expect(Number(width)).toBeGreaterThan(0);
    expect(Number(height)).toBeGreaterThan(0);
  });

  test("images have lazy loading attributes", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();
    const img = lightbox.locator("img");
    await expect(img).toHaveAttribute("loading", "lazy");
    await expect(img).toHaveAttribute("decoding", "async");
  });

  test("inline markdown images are also WebP", async ({ page }) => {
    // Find a page with inline markdown images
    await page.goto("/global/button");
    // Markdown images are inside .u-text-max-width sections
    const mdImages = page.locator(
      ".u-text-max-width image-lightbox img, section image-lightbox img",
    );
    const count = await mdImages.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const src = await mdImages.nth(i).getAttribute("src");
        expect(src).toMatch(/\/_astro\/.*\.webp$/);
      }
    }
  });

  test("image lightbox still works with optimized images", async ({ page }) => {
    await page.goto("/global/button");
    const lightbox = page.locator("image-lightbox").first();
    const img = lightbox.locator("img").first();

    const originalSrc = await img.getAttribute("src");
    expect(originalSrc).toMatch(/\.webp$/);

    await img.click();
    const dialog = lightbox.locator("dialog");
    await expect(dialog).toHaveAttribute("open", "");

    const dialogImg = lightbox.locator("dialog img");
    const dialogSrc = await dialogImg.getAttribute("src");
    expect(dialogSrc).toContain(".webp");
  });
});
