import type { CodaClient } from "../client";
import { handleApiResponse } from "../utils";

interface ExportJob {
  id: string;
  status: string;
  href?: string;
  downloadLink?: string;
}

/**
 * Export page content as HTML or Markdown.
 * This is an async operation that polls until complete.
 */
export async function exportPageContent(
  client: CodaClient,
  apiToken: string,
  docId: string,
  pageIdOrName: string,
  outputFormat: "html" | "markdown" = "markdown"
): Promise<string> {
  // Start the export
  const exportResponse = await client.POST(
    "/docs/{docId}/pages/{pageIdOrName}/export",
    {
      params: { path: { docId, pageIdOrName } },
      body: { outputFormat },
    }
  );
  const exportJob = (await handleApiResponse(
    exportResponse,
    `Failed to start export for page ${pageIdOrName} from doc ${docId}`
  )) as ExportJob;

  // Check if already complete with download link
  if (exportJob.downloadLink && exportJob.status === "complete") {
    return fetchContent(exportJob.downloadLink);
  }

  // Poll until complete
  const maxAttempts = 30;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(attempt === 1 ? 1500 : 1000);

    const statusResponse = await client.GET(
      "/docs/{docId}/pages/{pageIdOrName}/export/{requestId}",
      {
        params: {
          path: { docId, pageIdOrName, requestId: exportJob.id },
        },
      }
    );

    if (statusResponse.error) {
      // Try the href link as fallback (requires auth)
      if (exportJob.href) {
        const content = await tryHrefFallback(exportJob.href, apiToken);
        if (content) return content;
      }

      if (attempt > 10) {
        throw new Error(
          `Export failed — status check returned error: ${JSON.stringify(statusResponse.error)}`
        );
      }
      continue;
    }

    const statusData = (await handleApiResponse(
      statusResponse,
      `Failed to check export status for page ${pageIdOrName}`
    )) as ExportJob;

    if (statusData.downloadLink && statusData.status === "complete") {
      return fetchContent(statusData.downloadLink);
    }

    if (statusData.status !== "inProgress") {
      throw new Error(`Export failed with status: ${statusData.status}`);
    }
  }

  throw new Error(`Export timed out after ${maxAttempts} seconds`);
}

async function fetchContent(downloadLink: string): Promise<string> {
  const response = await fetch(downloadLink);
  return response.text();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try fetching export result from the href link as a fallback.
 */
async function tryHrefFallback(
  href: string,
  apiToken: string
): Promise<string | null> {
  try {
    const response = await fetch(href, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    const data = (await response.json()) as ExportJob;
    if (data.downloadLink) {
      return fetchContent(data.downloadLink);
    }
  } catch {
    // Fallback failed silently
  }
  return null;
}
