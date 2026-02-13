import { marked, Renderer } from "marked";

// Custom renderer that wraps images in <image-lightbox>
const renderer = new Renderer();
renderer.image = function ({ href, title, text }) {
  const titleAttr = title ? ` title="${title}"` : "";
  return `<image-lightbox><img src="${href}" alt="${text}"${titleAttr} /></image-lightbox>`;
};

// Configure marked for GFM (tables, strikethrough, etc.)
marked.use({
  gfm: true,
  breaks: false,
  renderer,
});

export function renderMarkdown(content: string): string {
  if (!content || !content.trim()) return "";
  return marked.parse(content) as string;
}
