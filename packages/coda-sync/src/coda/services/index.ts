import type { CodaClient } from "../client"
import * as docService from "./docs"
import * as pageService from "./pages"
import * as tableService from "./tables"

/**
 * Creates a collection of service methods bound to a specific client
 */
export function createServices(client: CodaClient) {
    return {
        // Doc operations
        listDocs: () => docService.listDocs(client),
        getDoc: (docId: string) => docService.getDoc(client, docId),

        // Page operations
        listPages: (docId: string) => pageService.listPages(client, docId),
        getPage: (docId: string, pageIdOrName: string) =>
            pageService.getPage(client, docId, pageIdOrName),
        exportPageContent: (
            docId: string,
            pageIdOrName: string,
            outputFormat: "html" | "markdown" = "markdown"
        ) => pageService.exportPageContent(client, docId, pageIdOrName, outputFormat),

        // Table operations
        listTables: (docId: string) => tableService.listTables(client, docId),
        getTable: (docId: string, tableIdOrName: string) =>
            tableService.getTable(client, docId, tableIdOrName),
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
        getTableColumns: (docId: string, tableIdOrName: string) =>
            tableService.getTableColumns(client, docId, tableIdOrName),
        getRow: (
            docId: string,
            tableIdOrName: string,
            rowIdOrName: string,
            options?: {
                useColumnNames?: boolean
                valueFormat?: "simple" | "simpleWithArrays" | "rich"
            }
        ) => tableService.getRow(client, docId, tableIdOrName, rowIdOrName, options),
    }
}

export type CodaServices = ReturnType<typeof createServices>
