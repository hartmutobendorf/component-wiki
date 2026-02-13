import type { CodaClient } from "../client"
import { handleApiResponse } from "../utils"

/**
 * Get all rows from a table
 */
export async function getTableRows(
    client: CodaClient,
    docId: string,
    tableIdOrName: string,
    options?: {
        limit?: number
        pageToken?: string
        useColumnNames?: boolean
        valueFormat?: "simple" | "simpleWithArrays" | "rich"
    }
) {
    const response = await client.GET(
        "/docs/{docId}/tables/{tableIdOrName}/rows",
        {
            params: {
                path: { docId, tableIdOrName },
                query: {
                    limit: options?.limit,
                    pageToken: options?.pageToken,
                    useColumnNames: options?.useColumnNames,
                    valueFormat: options?.valueFormat,
                },
            },
        }
    )
    return handleApiResponse(
        response,
        `Failed to fetch rows for table ${tableIdOrName} from doc ${docId}`
    )
}
