import type { APIRoute, GetStaticPaths } from "astro";
import { getEntry } from "astro:content";
import { getConstructPaths } from "../../utils/static-paths";
import { generateComponentMarkdown } from "../../utils/generate-component-markdown";

export const getStaticPaths: GetStaticPaths = getConstructPaths;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) return new Response("Not found", { status: 404 });

  const construct = await getEntry("constructs", slug);
  if (!construct) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(generateComponentMarkdown(construct.data), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
