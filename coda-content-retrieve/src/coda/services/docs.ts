import type { CodaClient } from "../client"
import { handleApiResponse } from "../utils"

/**
 * List all accessible docs
 */
export async function listDocs(client: CodaClient) {
    const response = await client.GET("/docs")
    return handleApiResponse(response, "Failed to fetch docs")
}

/**
 * Get a specific doc by ID
 */
export async function getDoc(client: CodaClient, docId: string) {
    const response = await client.GET("/docs/{docId}", {
        params: { path: { docId } },
    })
    return handleApiResponse(response, `Failed to fetch doc ${docId}`)
}
