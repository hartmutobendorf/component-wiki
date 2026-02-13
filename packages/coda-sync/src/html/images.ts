/**
 * Image downloading — handles images from both API ImageObjects
 * and inline HTML content.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { basename } from "node:path";
import type { CollectedImage } from "../api/normalize";

/**
 * Extract file extension from a URL or response header filename.
 */
function getExtension(url: string, response: Response): string {
  const originalFilename =
    response.headers.get("x-amz-meta-filename") || "";
  if (originalFilename) {
    const lastDot = originalFilename.lastIndexOf(".");
    if (lastDot !== -1) {
      const ext = originalFilename.substring(lastDot);
      if (ext.length <= 5 && /^\.[a-z]+$/i.test(ext)) {
        return ext;
      }
    }
  }

  // Fall back to URL path extension
  try {
    const pathname = new URL(url).pathname;
    const lastDot = pathname.lastIndexOf(".");
    if (lastDot !== -1) {
      const ext = pathname.substring(lastDot);
      if (ext.length <= 5 && /^\.[a-z]+$/i.test(ext)) {
        return ext;
      }
    }
  } catch {
    // Not a valid URL
  }

  return ".png";
}

/**
 * Download a single image to the specified file path.
 */
async function downloadImageTo(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  await writeFile(filePath, Buffer.from(buffer));
}

/**
 * Download all images collected by ImageCollector and HTML inline images.
 * Returns a map of original URL → local path (relative to data/raw/).
 *
 * - For ImageCollector images: uses the pre-assigned local path (images/{uuid}.ext)
 * - For HTML inline images: assigns a new UUID-based path at download time
 */
export async function downloadAllImages(
  collectedImages: CollectedImage[],
  htmlImageUrls: string[],
  outputDir: string
): Promise<Map<string, string>> {
  await mkdir(outputDir, { recursive: true });

  const urlToPath = new Map<string, string>();
  const seenUrls = new Set<string>();

  // Build the download plan from ImageCollector (pre-assigned paths)
  for (const img of collectedImages) {
    if (img.url && !seenUrls.has(img.url)) {
      seenUrls.add(img.url);
      urlToPath.set(img.url, img.localPath);
    }
  }

  // Add HTML inline images that weren't already collected
  for (const url of htmlImageUrls) {
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      // These don't have pre-assigned paths — we'll assign after download
      // when we know the extension from the response
      urlToPath.set(url, ""); // placeholder, filled during download
    }
  }

  let downloaded = 0;
  let failed = 0;

  const downloadPromises = [...urlToPath.entries()].map(
    async ([url, preAssignedPath]) => {
      try {
        let localPath: string;

        if (preAssignedPath) {
          // ImageCollector pre-assigned path — download directly to it
          const filename = basename(preAssignedPath);
          const filePath = `${outputDir}/${filename}`;
          await downloadImageTo(url, filePath);
          localPath = preAssignedPath;
        } else {
          // HTML inline image — determine extension from response, assign UUID
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          const ext = getExtension(url, response);
          const filename = `${crypto.randomUUID()}${ext}`;
          await writeFile(`${outputDir}/${filename}`, Buffer.from(buffer));
          localPath = `images/${filename}`;
        }

        urlToPath.set(url, localPath);
        downloaded++;
      } catch (e) {
        console.log(`  Failed to download image: ${url} — ${e}`);
        urlToPath.delete(url);
        failed++;
      }
    }
  );

  await Promise.all(downloadPromises);

  console.log(
    `  ${downloaded} downloaded, ${failed} failed, ${seenUrls.size} total`
  );

  return urlToPath;
}
