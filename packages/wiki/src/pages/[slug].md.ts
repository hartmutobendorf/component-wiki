import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";
import { generateComponentMarkdown } from "../utils/generate-component-markdown";

export const getStaticPaths: GetStaticPaths = async () => {
  const components = await getCollection("components");
  return components.map((component) => ({
    params: { slug: component.id },
  }));
};

export const GET: APIRoute = async ({ params }) => {
  const component = await getEntry("components", params.slug!);
  if (!component) {
    return new Response("Not found", { status: 404 });
  }

  const md = generateComponentMarkdown(component.data);

  return new Response(md, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
