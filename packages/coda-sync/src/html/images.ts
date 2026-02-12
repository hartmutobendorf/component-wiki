/**
 * Image downloading — handles images from both API ImageObjects
 * and inline HTML content.
 */
import { writeFile, mkdir } from "node:fs/promises";
import type { CollectedImage } from "../api/normalize";

/**
 * Download a single image, returns the filename from response headers
 * or generates a UUID-based name.
 */
export async function downloadImage(
  url: string,
  outputDir: string
): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  // Get filename from x-amz-meta-filename header if available
  const originalFilename =
    response.headers.get("x-amz-meta-filename") || "image.jpg";

  const lastDotIndex = originalFilename.lastIndexOf(".");
  const extension =
    lastDotIndex !== -1 ? originalFilename.substring(lastDotIndex) : ".jpg";

  const filename = `${crypto.randomUUID()}${extension}`;
  const filePath = `${outputDir}/${filename}`;
  await writeFile(filePath, Buffer.from(buffer));

  return filename;
}

/**
 * Download all images collected by ImageCollector and HTML inline images.
 * Returns a map of original URL → local path (relative to data/raw/).
 */
export async function downloadAllImages(
  collectedImages: CollectedImage[],
  htmlImageUrls: string[],
  outputDir: string
): Promise<Map<string, string>> {
  await mkdir(outputDir, { recursive: true });

  const urlToPath = new Map<string, string>();
  const allUrls = new Set<string>();

  // Collect unique URLs from API ImageObjects
  for (const img of collectedImages) {
    if (img.url && !allUrls.has(img.url)) {
      allUrls.add(img.url);
      urlToPath.set(img.url, img.localPath);
    }
  }

  // Collect unique URLs from HTML inline images
  for (const url of htmlImageUrls) {
    if (url && !allUrls.has(url)) {
      allUrls.add(url);
    }
  }

  // Download all unique images
  let downloaded = 0;
  let failed = 0;

  const downloadPromises = [...allUrls].map(async (url) => {
    try {
      const filename = await downloadImage(url, outputDir);
      const localPath = `images/${filename}`;

      // If this URL was already mapped by ImageCollector, also keep that mapping
      // but update the actual downloaded filename
      if (!urlToPath.has(url)) {
        urlToPath.set(url, localPath);
      } else {
        // ImageCollector assigned a path pre-download; now we have the real filename.
        // We need to rename or update. Since ImageCollector paths are pre-assigned UUIDs,
        // and downloadImage generates its own UUID, let's use the downloaded one.
        const collectorPath = urlToPath.get(url)!;
        // The file was downloaded with `filename` but collector expected `collectorPath`.
        // Rename: move the file to the collector's expected path
        const { rename } = await import("node:fs/promises");
        const actualFile = `${outputDir}/${filename}`;
        const expectedFile = `${outputDir}/../${collectorPath}`;
        try {
          await rename(actualFile, expectedFile);
          // Keep the collector's path mapping
        } catch {
          // If rename fails, just update the mapping
          urlToPath.set(url, localPath);
        }
      }

      downloaded++;
    } catch (e) {
      console.log(`  Failed to download image: ${url} — ${e}`);
      failed++;
    }
  });

  await Promise.all(downloadPromises);

  console.log(
    `Images: ${downloaded} downloaded, ${failed} failed, ${allUrls.size} total`
  );

  return urlToPath;
}
