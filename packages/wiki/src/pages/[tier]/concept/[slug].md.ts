import type { APIRoute, GetStaticPaths } from "astro";
import { getEntry } from "astro:content";
import { getConceptPaths } from "../../../utils/static-paths";
import { generateConceptMarkdown } from "../../../utils/generate-concept-markdown";

export const getStaticPaths: GetStaticPaths = getConceptPaths;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) return new Response("Not found", { status: 404 });

  const concept = await getEntry("concepts", slug);
  if (!concept) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(generateConceptMarkdown(concept.data), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
