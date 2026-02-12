import type { CodaClient } from "../client"
import * as pageService from "./pages"
import * as tableService from "./tables"

/**
 * Creates a collection of service methods bound to a specific client
 */
export function createServices(client: CodaClient) {
    return {
        exportPageContent: (
            docId: string,
            pageIdOrName: string,
            outputFormat: "html" | "markdown" = "markdown"
        ) => pageService.exportPageContent(client, docId, pageIdOrName, outputFormat),

        getTableRows: (
            docId: string,
            tableIdOrName: string,
            options?: {
                limit?: number
                pageToken?: string
                useColumnNames?: boolean
                valueFormat?: "simple" | "simpleWithArrays" | "rich"
            }
        ) => tableService.getTableRows(client, docId, tableIdOrName, options),
    }
}

export type CodaServices = ReturnType<typeof createServices>
