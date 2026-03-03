/**
 * Shared image optimization utilities.
 *
 * Images live in data/raw/images/ (written by coda-sync), outside the
 * Astro project root. They're made available to the asset pipeline via
 * a Vite resolve.alias (@images) and import.meta.glob() in each .astro
 * file that needs them.
 *
 * import.meta.glob() MUST be called in the .astro file (Vite requires
 * a static string literal at the call site). But everything after the
 * glob — building the lookup map, calling getImage(), constructing the
 * OptimizedImageInfo records — is shared here.
 */

import { getImage } from "astro:assets";
import type { OptimizedImageInfo } from "./render-markdown.ts";

/** The glob result type returned by import.meta.glob for image files. */
export type ImageGlobResult = Record<string, { default: ImageMetadata }>;

/**
 * Build a filename → ImageMetadata lookup map from a glob result.
 *
 * Usage in .astro frontmatter:
 * ```ts
 * const glob = import.meta.glob<{ default: ImageMetadata }>(
 *   "/../../data/raw/images/*.{png,jpg,jpeg,gif,svg,webp}",
 *   { eager: true },
 * );
 * const lookup = buildImageLookup(glob);
 * ```
 */
export function buildImageLookup(
  globResult: ImageGlobResult,
): Map<string, ImageMetadata> {
  const map = new Map<string, ImageMetadata>();
  for (const [path, mod] of Object.entries(globResult)) {
    const filename = path.split("/").pop()!;
    map.set(filename, mod.default);
  }
  return map;
}

/**
 * Resolve an image path (e.g. "images/abc.png") to its ImageMetadata
 * using the filename lookup map. Returns undefined if not found.
 */
export function resolveImage(
  imagePath: string,
  lookup: Map<string, ImageMetadata>,
): ImageMetadata | undefined {
  const filename = imagePath.split("/").pop()!;
  return lookup.get(filename);
}

/**
 * Build an OptimizedImageInfo map for a list of image paths by calling
 * Astro's getImage() for each. Used by ConstructPage/ConceptPage to
 * optimize inline markdown images.
 *
 * @param imagePaths - Paths as they appear in markdown (e.g. "images/abc.png")
 * @param lookup - Filename → ImageMetadata map from buildImageLookup()
 * @returns Map of original path → optimized image info
 */
export async function buildOptimizedImageMap(
  imagePaths: string[],
  lookup: Map<string, ImageMetadata>,
): Promise<Map<string, OptimizedImageInfo>> {
  const imageMap = new Map<string, OptimizedImageInfo>();

  for (const imgPath of imagePaths) {
    const imageMeta = resolveImage(imgPath, lookup);
    if (imageMeta) {
      const optimized = await getImage({ src: imageMeta });
      imageMap.set(imgPath, {
        src: optimized.src,
        width: optimized.attributes.width as number,
        height: optimized.attributes.height as number,
      });
    }
  }

  return imageMap;
}
