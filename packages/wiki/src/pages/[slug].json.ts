import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";

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

  return new Response(JSON.stringify(component.data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
