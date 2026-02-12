import type { CodaClient } from "../client"
import { handleApiResponse } from "../utils"

/**
 * Export page content as HTML or Markdown.
 * This is an async operation that polls until complete.
 */
export async function exportPageContent(
    client: CodaClient,
    docId: string,
    pageIdOrName: string,
    outputFormat: "html" | "markdown" = "markdown"
) {
    // Start the export
    const exportResponse = await client.POST(
        "/docs/{docId}/pages/{pageIdOrName}/export",
        {
            params: { path: { docId, pageIdOrName } },
            body: { outputFormat },
        }
    )
    const exportJob = await handleApiResponse(
        exportResponse,
        `Failed to start export for page ${pageIdOrName} from doc ${docId}`
    ) as any

    // Check if already complete with download link
    if ((exportJob as any).downloadLink && exportJob.status === "complete") {
        const contentResponse = await fetch((exportJob as any).downloadLink)
        const content = await contentResponse.text()
        return content
    }

    // Poll until complete
    let exportId = exportJob.id
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max
    let lastError: any = null

    while (attempts < maxAttempts) {
        attempts++
        await new Promise((resolve) => setTimeout(resolve, attempts === 1 ? 500 : 1000))

        const statusResponse = await client.GET(
            "/docs/{docId}/pages/{pageIdOrName}/export/{requestId}",
            {
                params: { path: { docId, pageIdOrName, requestId: exportId } },
            }
        )

        if (statusResponse.error) {
            lastError = statusResponse.error
            console.log(`Status check returned error, trying href link...`)

            if (exportJob.href) {
                try {
                    const hrefResponse = await fetch(exportJob.href, {
                        headers: {
                            Authorization: `Bearer ${process.env.CODA_API_TOKEN}`,
                        },
                    })
                    const hrefData = await hrefResponse.json() as any

                    if (hrefData.downloadLink) {
                        const contentResponse = await fetch(hrefData.downloadLink)
                        const content = await contentResponse.text()
                        return content
                    }
                } catch (e) {
                    console.log(`  Failed to fetch from href: ${e}`)
                }
            }

            if (attempts > 3) {
                break
            }
            continue
        }

        const statusData = await handleApiResponse(
            statusResponse,
            `Failed to check export status for page ${pageIdOrName}`
        ) as any

        if ((statusData as any).downloadLink && statusData.status === "complete") {
            const contentResponse = await fetch((statusData as any).downloadLink)
            const content = await contentResponse.text()
            return content
        }

        if (statusData.status !== "inProgress") {
            throw new Error(`Export failed with status: ${statusData.status}`)
        }
    }

    if (attempts >= maxAttempts) {
        throw new Error(`Export timed out after ${maxAttempts} seconds`)
    }

    throw new Error(`Export failed - status check returned 404. Last error: ${JSON.stringify(lastError)}`)
}
