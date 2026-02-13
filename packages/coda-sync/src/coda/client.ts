import createClient from "openapi-fetch";
import type { paths } from "../api/types";

/**
 * Creates a configured Coda API client
 */
export function createCodaClient(baseUrl: string, apiToken: string) {
  return createClient<paths>({
    baseUrl,
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
}

/**
 * Type alias for the Coda API client
 */
export type CodaClient = ReturnType<typeof createCodaClient>;
