import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";

export const getStaticPaths: GetStaticPaths = async () => {
  const concepts = await getCollection("concepts");
  return concepts
    .filter((c) => c.data.tier === "Sites")
    .map((c) => ({ params: { slug: c.id } }));
};

export const GET: APIRoute = async ({ params }) => {
  const concept = await getEntry("concepts", params.slug!);
  if (!concept) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(JSON.stringify(concept.data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
