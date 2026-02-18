import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";
import { generateComponentMarkdown } from "../utils/generate-component-markdown";

export const getStaticPaths: GetStaticPaths = async () => {
  const constructs = await getCollection("constructs");
  return constructs.map((construct) => ({
    params: { slug: construct.id },
  }));
};

export const GET: APIRoute = async ({ params }) => {
  const construct = await getEntry("constructs", params.slug!);
  if (!construct) {
    return new Response("Not found", { status: 404 });
  }

  const md = generateComponentMarkdown(construct.data);

  return new Response(md, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
