import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";

export const getStaticPaths: GetStaticPaths = async () => {
  const constructs = await getCollection("constructs");
  return constructs
    .filter((c) => c.data.figmaComponentData)
    .map((construct) => ({
      params: { slug: construct.id },
    }));
};

export const GET: APIRoute = async ({ params }) => {
  const construct = await getEntry("constructs", params.slug!);
  if (!construct || !construct.data.figmaComponentData) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(construct.data.figmaComponentData, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
