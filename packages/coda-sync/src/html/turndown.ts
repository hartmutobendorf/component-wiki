/**
 * HTML-to-Markdown conversion with image tracking.
 */
import TurndownService from "turndown";

interface TrackedImage {
  src: string;
  alt: string;
}

/**
 * Convert HTML to markdown, tracking all image URLs found.
 */
export function htmlToMarkdown(html: string): {
  markdown: string;
  imageUrls: string[];
} {
  if (!html || !html.trim()) {
    return { markdown: "", imageUrls: [] };
  }

  const images: TrackedImage[] = [];

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  // Handle spans with inline styles (bold, italic)
  turndown.addRule("inlineStyles", {
    filter: (node: any) => {
      return node.nodeName === "SPAN" && !!node.getAttribute("style");
    },
    replacement: (content: string, node: any) => {
      const style = (node.getAttribute("style") || "") as string;

      if (
        style.includes("font-weight: bold") ||
        style.includes("font-weight:bold")
      ) {
        return `**${content}**`;
      }

      if (
        style.includes("font-style: italic") ||
        style.includes("font-style:italic")
      ) {
        return `_${content}_`;
      }

      return content;
    },
  });

  // Track images and insert placeholders
  turndown.addRule("image", {
    filter: "img",
    replacement: (_content: string, node: any) => {
      const src = node.getAttribute("src") || "";
      const alt = node.getAttribute("alt") || "image";

      images.push({ src, alt });
      const idx = images.length - 1;
      return `![${alt}](IMAGE_PLACEHOLDER_${idx})`;
    },
  });

  let markdown = turndown.turndown(html);

  // Return imageUrls for later download and placeholder replacement
  const imageUrls = images.map((img) => img.src);

  return { markdown, imageUrls };
}

/**
 * Replace image placeholders in markdown with actual local paths.
 */
export function replaceImagePlaceholders(
  markdown: string,
  urlToPath: Map<string, string>,
  imageUrls: string[]
): string {
  let result = markdown;

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const localPath = urlToPath.get(url);
    if (localPath) {
      result = result.replace(`IMAGE_PLACEHOLDER_${i}`, localPath);
    } else {
      // Remove the broken image reference
      result = result.replace(
        new RegExp(`!\\[[^\\]]*\\]\\(IMAGE_PLACEHOLDER_${i}\\)`),
        ""
      );
    }
  }

  return result.trim();
}
