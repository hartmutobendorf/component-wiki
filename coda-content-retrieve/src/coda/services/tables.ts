import type { CodaClient } from "../client"
import { handleApiResponse } from "../utils"

/**
 * List all tables in a doc
 */
export async function listTables(client: CodaClient, docId: string) {
    const response = await client.GET("/docs/{docId}/tables", {
        params: { path: { docId } },
    })
    return handleApiResponse(response, `Failed to fetch tables for doc ${docId}`)
}

/**
 * Get a specific table
 */
export async function getTable(
    client: CodaClient,
    docId: string,
    tableIdOrName: string
) {
    const response = await client.GET("/docs/{docId}/tables/{tableIdOrName}", {
        params: { path: { docId, tableIdOrName } },
    })
    return handleApiResponse(
        response,
        `Failed to fetch table ${tableIdOrName} from doc ${docId}`
    )
}

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

/**
 * Get all columns from a table
 */
export async function getTableColumns(
    client: CodaClient,
    docId: string,
    tableIdOrName: string
) {
    const response = await client.GET(
        "/docs/{docId}/tables/{tableIdOrName}/columns",
        {
            params: { path: { docId, tableIdOrName } },
        }
    )
    return handleApiResponse(
        response,
        `Failed to fetch columns for table ${tableIdOrName} from doc ${docId}`
    )
}

/**
 * Get a specific row from a table
 */
export async function getRow(
    client: CodaClient,
    docId: string,
    tableIdOrName: string,
    rowIdOrName: string,
    options?: {
        useColumnNames?: boolean
        valueFormat?: "simple" | "simpleWithArrays" | "rich"
    }
) {
    const response = await client.GET(
        "/docs/{docId}/tables/{tableIdOrName}/rows/{rowIdOrName}",
        {
            params: {
                path: { docId, tableIdOrName, rowIdOrName },
                query: {
                    useColumnNames: options?.useColumnNames,
                    valueFormat: options?.valueFormat,
                },
            },
        }
    )
    return handleApiResponse(
        response,
        `Failed to fetch row ${rowIdOrName} from table ${tableIdOrName} in doc ${docId}`
    )
}
