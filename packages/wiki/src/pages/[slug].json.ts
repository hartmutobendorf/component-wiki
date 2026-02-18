import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";

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

  return new Response(JSON.stringify(construct.data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
