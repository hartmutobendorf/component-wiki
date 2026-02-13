import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";

export const getStaticPaths: GetStaticPaths = async () => {
  const components = await getCollection("components");
  return components
    .filter((c) => c.data.figmaComponentData)
    .map((component) => ({
      params: { slug: component.id },
    }));
};

export const GET: APIRoute = async ({ params }) => {
  const component = await getEntry("components", params.slug!);
  if (!component || !component.data.figmaComponentData) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(component.data.figmaComponentData, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
