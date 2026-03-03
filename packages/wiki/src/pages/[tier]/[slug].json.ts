import type { APIRoute, GetStaticPaths } from "astro";
import { getEntry } from "astro:content";
import { getConstructPaths } from "../../utils/static-paths";

export const getStaticPaths: GetStaticPaths = getConstructPaths;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) return new Response("Not found", { status: 404 });

  const construct = await getEntry("constructs", slug);
  if (!construct) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(JSON.stringify(construct.data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
