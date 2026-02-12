import createClient from "openapi-fetch";
import type { paths } from "../api/types";
import { CODA_CONFIG } from "../config/coda";

/**
 * Creates a configured Coda API client with the provided API token
 *
 * @param apiToken - Your Coda API token (get one at https://coda.io/account)
 * @returns Fully typed Coda API client
 */
export function createCodaClient(apiToken: string) {
  return createClient<paths>({
    baseUrl: CODA_CONFIG.baseUrl,
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
}

/**
 * Type alias for the Coda API client
 */
export type CodaClient = ReturnType<typeof createCodaClient>;
