import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import * as cheerio from "cheerio"
import TurndownService from "turndown"
import { coda } from "./src/coda"
import { CODA_CONFIG } from "./src/config/coda"

interface ChangeLogEntry {
    who: string
    when: string
    what: string
}

interface DecisionLogEntry {
    where: string
    decisionMade: string
    link: string
}

interface PropertyEntry {
    name: string
    required?: boolean
    type: string
    description?: string
    constraint?: string
    options?: string[]
    defaultOption?: string
}

interface AnatomyEntry {
    number: number
    name: string
    description: string
}

interface RowData {
    name: string
    "documentation-status": string
    type: string
    tiers: string
    "last-edited": string
    usage: string
    description: string
    examples: string
    "figma-link": string
    "code-link": string
    "figma-component-data": string
    "component-example-image": string
    "anatomy-image": string
    "ui-blocks-used-in-pattern": string
    "change-log": ChangeLogEntry[]
    "decision-log": DecisionLogEntry[]
}

// Helper function to download an image and return the filename from headers
async function downloadImage(
    url: string,
    folderPath: string
): Promise<string> {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()

    // Get filename from x-amz-meta-filename header
    const originalFilename =
        response.headers.get("x-amz-meta-filename") || "image.jpg"

    // Extract file extension from original filename
    const lastDotIndex = originalFilename.lastIndexOf(".")
    const extension =
        lastDotIndex !== -1 ? originalFilename.substring(lastDotIndex) : ".jpg"

    // Generate unique filename with UUID
    const uuid = crypto.randomUUID()
    const filename = `${uuid}${extension}`

    const filePath = `${folderPath}/${filename}`
    await writeFile(filePath, Buffer.from(buffer))

    return filename
}

// Custom Turndown service that tracks images and handles inline styles
class ImageTrackingTurndownService extends TurndownService {
    images: Array<{ src: string; alt: string; mimeType: string | null }> = []

    constructor(options?: any) {
        super(options)

        // Add rule to handle spans with inline styles (bold, italic, etc.)
        this.addRule("inlineStyles", {
            filter: (node: any) => {
                if (node.nodeName === "SPAN" && node.getAttribute("style")) {
                    return true
                }
                return false
            },
            replacement: (content, node: any) => {
                const style = node.getAttribute("style") || ""

                // Check for bold styling
                if (
                    style.includes("font-weight: bold") ||
                    style.includes("font-weight:bold")
                ) {
                    return `**${content}**`
                }

                // Check for italic styling
                if (
                    style.includes("font-style: italic") ||
                    style.includes("font-style:italic")
                ) {
                    return `_${content}_`
                }

                // Default: just return the content
                return content
            },
        })

        // Override image rule to track images
        this.addRule("image", {
            filter: "img",
            replacement: (content, node: any) => {
                const src = node.getAttribute("src") || ""
                const alt = node.getAttribute("alt") || "image"
                const mimeType = node.getAttribute("data-coda-mime-type")

                this.images.push({ src, alt, mimeType })

                // Return placeholder that we'll replace later
                const imageIndex = this.images.length - 1
                return `![${alt}](IMAGE_PLACEHOLDER_${imageIndex})`
            },
        })
    }

    resetImages() {
        this.images = []
    }
}

// Fetch change log entries for a component from the Change log table
async function fetchChangeLogEntriesForComponent(
    componentName: string,
    changeLogRows: any[]
): Promise<ChangeLogEntry[]> {
    const entries: ChangeLogEntry[] = []

    // Filter rows for this component
    for (const row of changeLogRows) {
        const values = row.values || {}

        // Check if this row is for the current component
        // Name field might be a single value, an array, or a comma-separated string
        let isMatch = false
        const nameValue = values.Name

        if (typeof nameValue === "string") {
            // Could be exact match or comma-separated list
            if (nameValue === componentName) {
                isMatch = true
            } else if (nameValue.includes(",")) {
                // Split by comma and check if component name is in the list
                const components = nameValue
                    .split(",")
                    .map((c: string) => c.trim())
                isMatch = components.includes(componentName)
            }
        } else if (Array.isArray(nameValue)) {
            // If it's an array, check if component name is in it
            isMatch = nameValue.includes(componentName)
        }

        if (isMatch) {
            // Skip empty rows
            if (!values.What && !values.Who && !values.When) {
                continue
            }

            entries.push({
                who: values.Who || "",
                when: values.When || "",
                what: values.What || "",
            })
        }
    }

    return entries
}

// Fetch decision log entries for a component from the Decision log table
async function fetchDecisionLogEntriesForComponent(
    componentName: string,
    decisionLogRows: any[]
): Promise<DecisionLogEntry[]> {
    const entries: DecisionLogEntry[] = []

    // Filter rows for this component
    for (const row of decisionLogRows) {
        const values = row.values || {}

        // Check if this row is for the current component
        // Component field might be a single value, an array, or a comma-separated string
        let isMatch = false
        const componentValue = values.Component

        if (typeof componentValue === "string") {
            // Could be exact match or comma-separated list
            if (componentValue === componentName) {
                isMatch = true
            } else if (componentValue.includes(",")) {
                // Split by comma and check if component name is in the list
                const components = componentValue
                    .split(",")
                    .map((c: string) => c.trim())
                isMatch = components.includes(componentName)
            }
        } else if (Array.isArray(componentValue)) {
            // If it's an array, check if component name is in it
            isMatch = componentValue.includes(componentName)
        }

        if (isMatch) {
            // Skip empty rows
            if (!values.Where && !values["Decision made"] && !values.Link) {
                continue
            }

            entries.push({
                where: values.Where || "",
                decisionMade: values["Decision made"] || "",
                link: values.Link || "",
            })
        }
    }

    return entries
}

// Fetch properties for a component from the Properties table
async function fetchPropertiesForComponent(
    componentName: string,
    propertiesRows: any[]
): Promise<PropertyEntry[]> {
    const properties: PropertyEntry[] = []

    // Filter rows for this component
    for (const row of propertiesRows) {
        const values = row.values || {}

        // Check if this row is for the current component
        // Component field might be a single value, an array, or a comma-separated string
        let isMatch = false
        const componentValue = values.Component

        if (typeof componentValue === "string") {
            // Could be exact match or comma-separated list
            if (componentValue === componentName) {
                isMatch = true
            } else if (componentValue.includes(",")) {
                // Split by comma and check if component name is in the list
                const components = componentValue
                    .split(",")
                    .map((c: string) => c.trim())
                isMatch = components.includes(componentName)
            }
        } else if (Array.isArray(componentValue)) {
            // If it's an array, check if component name is in it
            isMatch = componentValue.includes(componentName)
        }

        if (isMatch) {
            // Skip empty rows
            if (!values.Name) {
                continue
            }

            const property: PropertyEntry = {
                name: values.Name || "",
                type: (values.Type || "").toLowerCase(),
            }

            // Add optional fields if they exist
            if (values.Required !== undefined && values.Required !== null) {
                property.required = values.Required
            }
            if (values.Description) {
                property.description = values.Description
            }
            if (values.Constraint) {
                property.constraint = values.Constraint
            }
            if (values.Options) {
                // Options might be a comma-separated string or an array
                if (typeof values.Options === "string") {
                    property.options = values.Options.split(",")
                        .map((opt: string) => opt.trim())
                        .filter((opt: string) => opt.length > 0)
                } else if (Array.isArray(values.Options)) {
                    property.options = values.Options
                }
            }
            if (values["Default option"]) {
                property.defaultOption = values["Default option"]
            }

            properties.push(property)
        }
    }

    return properties
}

// Fetch anatomy entries for a component from the Anatomy table
async function fetchAnatomyEntriesForComponent(
    componentName: string,
    anatomyRows: any[]
): Promise<AnatomyEntry[]> {
    const entries: AnatomyEntry[] = []

    // Filter rows for this component
    for (const row of anatomyRows) {
        const values = row.values || {}

        // Check if this row is for the current component
        // Component field might be a single value, an array, or a comma-separated string
        let isMatch = false
        const componentValue = values.Component

        if (typeof componentValue === "string") {
            // Could be exact match or comma-separated list
            if (componentValue === componentName) {
                isMatch = true
            } else if (componentValue.includes(",")) {
                // Split by comma and check if component name is in the list
                const components = componentValue
                    .split(",")
                    .map((c: string) => c.trim())
                isMatch = components.includes(componentName)
            }
        } else if (Array.isArray(componentValue)) {
            // If it's an array, check if component name is in it
            isMatch = componentValue.includes(componentName)
        }

        if (isMatch) {
            // Skip empty rows
            if (!values.Name) {
                continue
            }

            entries.push({
                number: values.Number || 0,
                name: values.Name || "",
                description: values.Description || "",
            })
        }
    }

    return entries
}

// Extract structured data from HTML table
function extractTableData(pageHtml: string): RowData[] {
    const $ = cheerio.load(pageHtml)
    const rows: RowData[] = []

    // Find the table
    const table = $("table[data-coda-grid-id]").first()
    if (!table.length) {
        console.log("⚠ No table found in HTML")
        return rows
    }

    // Get column names from header
    const columnNames: string[] = []
    table.find("thead th").each((_, th) => {
        columnNames.push($(th).text().trim())
    })

    console.log(
        `  Found ${columnNames.length} columns:`,
        columnNames.join(", ")
    )

    // Map column names to their indices
    const columnMap: Record<string, number> = {}
    columnNames.forEach((name, index) => {
        columnMap[name] = index
    })

    // Process each data row
    table.find("tbody tr").each((_, tr) => {
        const $tr = $(tr)
        const cells = $tr.find("td")

        // Get the row name
        const name = cells
            .eq(columnMap["Name"] || 0)
            .text()
            .trim()

        if (!name) return // Skip rows without a name

        // Extract data for each field
        const rowData: RowData = {
            name,
            "documentation-status": "",
            type: "",
            tiers: "",
            "last-edited": "",
            usage: "",
            description: "",
            examples: "",
            "figma-link": "",
            "code-link": "",
            "figma-component-data": "",
            "component-example-image": "",
            "anatomy-image": "",
            "ui-blocks-used-in-pattern": "",
            "change-log": [],
            "decision-log": [],
        }

        // Extract documentation status (from link text)
        const statusCell = cells.eq(columnMap["Documentation status"])
        const statusLink = statusCell.find("a").first()
        rowData["documentation-status"] = statusLink.length
            ? statusLink.text().trim()
            : statusCell.text().trim()

        // Extract type (from link text)
        const typeCell = cells.eq(columnMap["Type"])
        const typeLink = typeCell.find("a").first()
        rowData.type = typeLink.length
            ? typeLink.text().trim()
            : typeCell.text().trim()

        // Extract tiers (from link text)
        const tiersCell = cells.eq(columnMap["Tiers"])
        const tiersLink = tiersCell.find("a").first()
        rowData.tiers = tiersLink.length
            ? tiersLink.text().trim()
            : tiersCell.text().trim()

        // Extract last edited date
        const lastEditedCell = cells.eq(columnMap["Last edited"])
        rowData["last-edited"] = lastEditedCell.text().trim()

        // Extract Figma link (from href attribute)
        const figmaCell = cells.eq(columnMap["Figma"])
        const figmaLink = figmaCell.find("a").first()
        rowData["figma-link"] = figmaLink.length
            ? figmaLink.attr("href") || ""
            : ""

        // Extract Code link (from href attribute)
        const codeCell = cells.eq(columnMap["Code"])
        const codeLink = codeCell.find("a").first()
        rowData["code-link"] = codeLink.length
            ? codeLink.attr("href") || ""
            : ""

        // Extract Figma component data (as text content)
        const figmaDataCell = cells.eq(columnMap["Figma component data"])
        rowData["figma-component-data"] = figmaDataCell.text().trim()

        // Extract Component example image (from img src)
        const exampleImageCell = cells.eq(columnMap["Component example image"])
        const exampleImageImg = exampleImageCell.find("img").first()
        rowData["component-example-image"] = exampleImageImg.length
            ? exampleImageImg.attr("src") || ""
            : ""

        // Extract Anatomy image (from img src)
        const anatomyImageCell = cells.eq(columnMap["Anatomy image"])
        const anatomyImageImg = anatomyImageCell.find("img").first()
        rowData["anatomy-image"] = anatomyImageImg.length
            ? anatomyImageImg.attr("src") || ""
            : ""

        // Extract UI blocks used in pattern (as text content, comma-separated)
        const uiBlocksCell = cells.eq(columnMap["UI blocks used in pattern"])
        rowData["ui-blocks-used-in-pattern"] = uiBlocksCell.text().trim()

        // Extract HTML for rich content fields - we'll convert these to markdown later
        const descriptionCell = cells.eq(columnMap["Description"])
        rowData.description = descriptionCell.html() || ""

        const examplesCell = cells.eq(columnMap["Examples"])
        rowData.examples = examplesCell.html() || ""

        const usageCell = cells.eq(columnMap["Usage"])
        rowData.usage = usageCell.html() || ""

        // Note: Change log will be fetched separately via API
        // and populated in the main processing loop

        rows.push(rowData)
    })

    console.log(`  Extracted ${rows.length} rows`)
    return rows
}

// Convert HTML to Markdown and handle images
async function convertHtmlToMarkdown(
    html: string,
    folderPath: string,
    imageFolderPath: string
): Promise<string> {
    if (!html || html.trim() === "") {
        return ""
    }

    // Create custom turndown service
    const turndownService = new ImageTrackingTurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
    })

    // Convert HTML to Markdown
    const markdown = turndownService.turndown(html)

    // Download images and replace placeholders
    let finalMarkdown = markdown

    for (let i = 0; i < turndownService.images.length; i++) {
        const image = turndownService.images[i]

        try {
            // Download image and get the actual filename from headers
            const filename = await downloadImage(image.src, imageFolderPath)
            console.log(`    ✓ Downloaded: ${filename}`)

            // Replace placeholder with relative path
            const placeholder = `IMAGE_PLACEHOLDER_${i}`
            finalMarkdown = finalMarkdown.replace(
                placeholder,
                `images/${filename}`
            )
        } catch (e) {
            console.log(`    ⚠ Failed to download image: ${e}`)
            // Remove the placeholder if download failed
            const placeholder = `![${image.alt}](IMAGE_PLACEHOLDER_${i})`
            finalMarkdown = finalMarkdown.replace(placeholder, "")
        }
    }

    return finalMarkdown.trim()
}

// Generate a complete markdown file with frontmatter for LLM consumption
function generateLLMMarkdown(
    componentMetadata: any,
    markdownContent: { description: string; usage: string; examples: string }
): string {
    const frontmatter = `---
name: ${componentMetadata.name}
type: ${componentMetadata.type}
tiers: ${componentMetadata.tiers}
documentationStatus: ${componentMetadata.documentationStatus}
lastEdited: ${componentMetadata.lastEdited}
figmaLink: ${componentMetadata.figmaLink}
codeLink: ${componentMetadata.codeLink}
---

`

    let markdown = frontmatter

    // Add main heading
    markdown += `# ${componentMetadata.name}\n\n`

    // Add description section
    if (markdownContent.description && markdownContent.description.trim()) {
        markdown += `## Description\n\n${markdownContent.description}\n\n`
    }

    // Add metadata section
    markdown += `## Metadata\n\n`
    markdown += `- **Type**: ${componentMetadata.type}\n`
    markdown += `- **Tier**: ${componentMetadata.tiers}\n`
    markdown += `- **Documentation Status**: ${componentMetadata.documentationStatus}\n`
    markdown += `- **Last Edited**: ${componentMetadata.lastEdited}\n`

    if (componentMetadata.figmaLink) {
        markdown += `- **Figma**: [View in Figma](${componentMetadata.figmaLink})\n`
    }

    if (componentMetadata.codeLink) {
        markdown += `- **Code**: [View on GitHub](${componentMetadata.codeLink})\n`
    }

    markdown += `\n`

    // Add anatomy section
    if (
        componentMetadata.anatomy &&
        componentMetadata.anatomy.table &&
        componentMetadata.anatomy.table.length > 0
    ) {
        markdown += `## Anatomy\n\n`

        const sortedAnatomy = [...componentMetadata.anatomy.table].sort(
            (a, b) => a.number - b.number
        )

        for (const item of sortedAnatomy) {
            markdown += `### ${item.number}. ${item.name}\n\n`
            markdown += `${item.description}\n\n`
        }
    }

    // Add usage section
    if (markdownContent.usage && markdownContent.usage.trim()) {
        markdown += `## Usage\n\n${markdownContent.usage}\n\n`
    }

    // Add examples section
    if (markdownContent.examples && markdownContent.examples.trim()) {
        markdown += `## Examples\n\n${markdownContent.examples}\n\n`
    }

    // Add properties section
    if (
        componentMetadata.properties &&
        componentMetadata.properties.length > 0
    ) {
        markdown += `## Properties\n\n`
        markdown += `| Name | Type | Required | Description | Constraint | Options | Default |\n`
        markdown += `|------|------|----------|-------------|------------|---------|----------|\n`

        for (const prop of componentMetadata.properties) {
            const name = prop.name || "-"
            const type = prop.type || "-"
            const required = prop.required ? "Yes" : "No"
            const description = (prop.description || "-")
                .replace(/\|/g, "\\|")
                .replace(/\n/g, " ")
            const constraint = (prop.constraint || "-")
                .replace(/\|/g, "\\|")
                .replace(/\n/g, " ")
            const options =
                prop.options && prop.options.length > 0
                    ? prop.options.join(", ")
                    : "-"
            const defaultOption = prop.defaultOption || "-"

            markdown += `| ${name} | ${type} | ${required} | ${description} | ${constraint} | ${options} | ${defaultOption} |\n`
        }

        markdown += `\n`
    }

    // Add changelog section
    if (
        componentMetadata.changeLog &&
        componentMetadata.changeLog.length > 0
    ) {
        markdown += `## Change Log\n\n`

        for (const entry of componentMetadata.changeLog) {
            const date = entry.when
                ? new Date(entry.when).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                  })
                : "Unknown date"
            markdown += `### ${date} - ${entry.who}\n\n`
            markdown += `${entry.what}\n\n`
        }
    }

    // Add decision log section
    if (
        componentMetadata.decisionLog &&
        componentMetadata.decisionLog.length > 0
    ) {
        markdown += `## Decision Log\n\n`
        markdown += `| Where | Decision Made | Link |\n`
        markdown += `|-------|---------------|------|\n`

        for (const entry of componentMetadata.decisionLog) {
            const where = (entry.where || "-")
                .replace(/\|/g, "\\|")
                .replace(/\n/g, " ")
            const decision = (entry.decisionMade || "-")
                .replace(/\|/g, "\\|")
                .replace(/\n/g, " ")
            const link = entry.link ? `[View](${entry.link})` : "-"

            markdown += `| ${where} | ${decision} | ${link} |\n`
        }

        markdown += `\n`
    }

    return markdown
}

async function main() {
    const docId = CODA_CONFIG.getDocId()
    const tableId = CODA_CONFIG.getTableId()
    const changeLogTableId = CODA_CONFIG.getChangeLogTableId()
    const propertiesTableId = CODA_CONFIG.getPropertiesTableId()
    const anatomyTableId = CODA_CONFIG.getAnatomyTableId()
    const decisionLogTableId = CODA_CONFIG.getDecisionLogTableId()

    if (!docId) {
        console.error("Error: CODA_DOC_ID environment variable is not set")
        console.log("Please add CODA_DOC_ID to your .env file")
        return
    }

    if (!tableId) {
        console.error("Error: CODA_TABLE_ID environment variable is not set")
        console.log("Please add CODA_TABLE_ID to your .env file")
        return
    }

    if (!changeLogTableId) {
        console.error(
            "Error: CODA_CHANGELOG_TABLE_ID environment variable is not set"
        )
        console.log("Please add CODA_CHANGELOG_TABLE_ID to your .env file")
        return
    }

    if (!propertiesTableId) {
        console.error(
            "Error: CODA_PROPERTIES_TABLE_ID environment variable is not set"
        )
        console.log("Please add CODA_PROPERTIES_TABLE_ID to your .env file")
        return
    }

    if (!anatomyTableId) {
        console.error(
            "Error: CODA_ANATOMY_TABLE_ID environment variable is not set"
        )
        console.log("Please add CODA_ANATOMY_TABLE_ID to your .env file")
        return
    }

    if (!decisionLogTableId) {
        console.error(
            "Error: CODA_DECISIONLOG_TABLE_ID environment variable is not set"
        )
        console.log("Please add CODA_DECISIONLOG_TABLE_ID to your .env file")
        return
    }

    console.log(`Fetching table: ${tableId} from doc: ${docId}\n`)

    // Get table info to find parent page
    const table = await coda.getTable(docId, tableId)
    console.log(`Table: ${table.name}`)
    console.log(`Parent: ${table.parent?.name} (${table.parent?.id})\n`)

    // Export the parent page content as HTML (includes images)
    let pageHtml = ""
    if (table.parent?.id) {
        console.log("Exporting parent page content as HTML...")
        pageHtml = await coda.exportPageContent(docId, table.parent.id, "html")
        console.log("✓ Page content exported\n")
    } else {
        console.error("Error: Table has no parent page")
        return
    }

    // Extract structured data from HTML
    console.log("📊 Extracting structured data from HTML...")
    const allRowsData = extractTableData(pageHtml)

    // Filter out rows with type "Block"
    const rowsData = allRowsData.filter(
        (row) => row.type.toLowerCase() !== "block"
    )
    console.log(
        `  Filtered out ${
            allRowsData.length - rowsData.length
        } row(s) with type "Block"`
    )
    console.log(`  Processing ${rowsData.length} remaining row(s)`)

    // Fetch all change log rows from the Change log table
    console.log("\n📋 Fetching change log data from API...")
    let changeLogRows: any[] = []
    try {
        let pageToken: string | undefined = undefined
        do {
            const changeLogResponse = await coda.getTableRows(
                docId,
                changeLogTableId,
                {
                    useColumnNames: true,
                    valueFormat: "simple",
                    pageToken,
                    limit: 100, // Fetch more per page to reduce API calls
                }
            )
            const items = (changeLogResponse as any).items || []
            changeLogRows.push(...items)
            pageToken = (changeLogResponse as any).nextPageToken
            console.log(
                `  Fetched ${items.length} change log rows (total: ${changeLogRows.length})`
            )
        } while (pageToken)
        console.log(`✓ Fetched ${changeLogRows.length} change log rows total`)
    } catch (error) {
        console.log(`⚠ Failed to fetch change log data: ${error}`)
    }

    // Fetch all properties rows from the Properties table
    console.log("\n📋 Fetching properties data from API...")
    let propertiesRows: any[] = []
    try {
        let pageToken: string | undefined = undefined
        do {
            const propertiesResponse = await coda.getTableRows(
                docId,
                propertiesTableId,
                {
                    useColumnNames: true,
                    valueFormat: "simple",
                    pageToken,
                    limit: 100, // Fetch more per page to reduce API calls
                }
            )
            const items = (propertiesResponse as any).items || []
            propertiesRows.push(...items)
            pageToken = (propertiesResponse as any).nextPageToken
            console.log(
                `  Fetched ${items.length} properties rows (total: ${propertiesRows.length})`
            )
        } while (pageToken)
        console.log(`✓ Fetched ${propertiesRows.length} properties rows total`)
    } catch (error) {
        console.log(`⚠ Failed to fetch properties data: ${error}`)
    }

    // Fetch all anatomy rows from the Anatomy table
    console.log("\n📋 Fetching anatomy data from API...")
    let anatomyRows: any[] = []
    try {
        let pageToken: string | undefined = undefined
        do {
            const anatomyResponse = await coda.getTableRows(
                docId,
                anatomyTableId,
                {
                    useColumnNames: true,
                    valueFormat: "simple",
                    pageToken,
                    limit: 100, // Fetch more per page to reduce API calls
                }
            )
            const items = (anatomyResponse as any).items || []
            anatomyRows.push(...items)
            pageToken = (anatomyResponse as any).nextPageToken
            console.log(
                `  Fetched ${items.length} anatomy rows (total: ${anatomyRows.length})`
            )
        } while (pageToken)
        console.log(`✓ Fetched ${anatomyRows.length} anatomy rows total`)
    } catch (error) {
        console.log(`⚠ Failed to fetch anatomy data: ${error}`)
    }

    // Fetch all decision log rows from the Decision log table
    console.log("\n📋 Fetching decision log data from API...")
    let decisionLogRows: any[] = []
    try {
        let pageToken: string | undefined = undefined
        do {
            const decisionLogResponse = await coda.getTableRows(
                docId,
                decisionLogTableId,
                {
                    useColumnNames: true,
                    valueFormat: "simple",
                    pageToken,
                    limit: 100, // Fetch more per page to reduce API calls
                }
            )
            const items = (decisionLogResponse as any).items || []
            decisionLogRows.push(...items)
            pageToken = (decisionLogResponse as any).nextPageToken
            console.log(
                `  Fetched ${items.length} decision log rows (total: ${decisionLogRows.length})`
            )
        } while (pageToken)
        console.log(
            `✓ Fetched ${decisionLogRows.length} decision log rows total`
        )
    } catch (error) {
        console.log(`⚠ Failed to fetch decision log data: ${error}`)
    }

    // Create components metadata directory
    await mkdir('../wiki/src/content/components', { recursive: true })

    // Process rows and create markdown files
    console.log("\n📝 Processing rows and creating markdown files...")

    for (const row of rowsData) {
        const name = row.name
        const folderName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        const mdFolderPath = `../wiki/src/content/md/${folderName}`
        const imagesFolderPath = `${mdFolderPath}/images`

        // Create directories
        await mkdir(imagesFolderPath, { recursive: true })

        // Clean up old images to avoid duplicates
        await rm(imagesFolderPath, { recursive: true, force: true })
        await mkdir(imagesFolderPath, { recursive: true })

        console.log(`  Processing: ${name}`)

        // Convert HTML fields to Markdown and handle images
        const contentFields = [
            { key: "usage", fileName: "usage.mdx" },
            { key: "description", fileName: "description.mdx" },
            { key: "examples", fileName: "examples.mdx" },
        ] as const

        for (const field of contentFields) {
            const html = row[field.key]
            const markdownPath = `${mdFolderPath}/${field.fileName}`

            // Convert HTML to Markdown with image handling
            const markdown = await convertHtmlToMarkdown(
                html,
                mdFolderPath,
                imagesFolderPath
            )

            // Save the markdown content
            await writeFile(markdownPath, markdown)
        }

        // Save Figma component data as HTML file if it exists
        let figmaComponentDataPath = ""
        if (
            row["figma-component-data"] &&
            row["figma-component-data"].trim()
        ) {
            const htmlPath = `${mdFolderPath}/figma-component-data.html`
            await writeFile(htmlPath, row["figma-component-data"])
            figmaComponentDataPath = `md/${folderName}/figma-component-data.html`
            console.log(`    ✓ Saved Figma component data HTML`)
        }

        // Download component example image if it exists
        let componentExampleImagePath = ""
        if (
            row["component-example-image"] &&
            row["component-example-image"].trim()
        ) {
            try {
                const filename = await downloadImage(
                    row["component-example-image"],
                    imagesFolderPath
                )
                componentExampleImagePath = `md/${folderName}/images/${filename}`
                console.log(
                    `    ✓ Downloaded component example image: ${filename}`
                )
            } catch (e) {
                console.log(
                    `    ⚠ Failed to download component example image: ${e}`
                )
            }
        }

        // Download anatomy image if it exists
        let anatomyImagePath = ""
        if (row["anatomy-image"] && row["anatomy-image"].trim()) {
            try {
                const filename = await downloadImage(
                    row["anatomy-image"],
                    imagesFolderPath
                )
                anatomyImagePath = `md/${folderName}/images/${filename}`
                console.log(`    ✓ Downloaded anatomy image: ${filename}`)
            } catch (e) {
                console.log(`    ⚠ Failed to download anatomy image: ${e}`)
            }
        }

        // Fetch change log entries for this component
        row["change-log"] = await fetchChangeLogEntriesForComponent(
            name,
            changeLogRows
        )
        if (row["change-log"].length > 0) {
            console.log(
                `    ✓ Found ${row["change-log"].length} change log entries`
            )
        }

        // Fetch decision log entries for this component
        row["decision-log"] = await fetchDecisionLogEntriesForComponent(
            name,
            decisionLogRows
        )
        if (row["decision-log"].length > 0) {
            console.log(
                `    ✓ Found ${row["decision-log"].length} decision log entries`
            )
        }

        // Fetch properties for this component
        const properties = await fetchPropertiesForComponent(
            name,
            propertiesRows
        )
        if (properties.length > 0) {
            console.log(`    ✓ Found ${properties.length} properties`)
        }

        // Fetch anatomy entries for this component
        const anatomyEntries = await fetchAnatomyEntriesForComponent(
            name,
            anatomyRows
        )
        if (anatomyEntries.length > 0) {
            console.log(`    ✓ Found ${anatomyEntries.length} anatomy entries`)
        }

        // Fetch child properties if this is a pattern with UI blocks
        const childProperties: Array<{
            name: string
            properties: PropertyEntry[]
        }> = []
        if (
            row.type.toLowerCase() === "pattern" &&
            row["ui-blocks-used-in-pattern"]
        ) {
            const childComponentNames = row["ui-blocks-used-in-pattern"]
                .split(",")
                .map((name) => name.trim())
                .filter((name) => name.length > 0)

            for (const childName of childComponentNames) {
                const childProps = await fetchPropertiesForComponent(
                    childName,
                    propertiesRows
                )
                if (childProps.length > 0) {
                    childProperties.push({
                        name: childName,
                        properties: childProps,
                    })
                }
            }

            if (childProperties.length > 0) {
                console.log(
                    `    ✓ Found properties for ${childProperties.length} child component(s)`
                )
            }
        }

        // Create metadata JSON file for this component
        const componentMetadata = {
            name: name,
            type: row.type,
            tiers: row.tiers,
            documentationStatus: row["documentation-status"],
            lastEdited: row["last-edited"],
            figmaLink: row["figma-link"],
            codeLink: row["code-link"],
            figmaComponentDataPath: figmaComponentDataPath,
            componentExampleImage: componentExampleImagePath,
            changeLog: row["change-log"],
            decisionLog: row["decision-log"],
            properties: properties,
            anatomy: {
                image: anatomyImagePath,
                table: anatomyEntries,
            },
            childProperties:
                childProperties.length > 0 ? childProperties : undefined,
        }

        const metadataPath = `../wiki/src/content/components/${folderName}.json`
        await writeFile(
            metadataPath,
            JSON.stringify(componentMetadata, null, 2)
        )

        // Generate and save LLM markdown file
        const llmMarkdownContent = generateLLMMarkdown(componentMetadata, {
            description: await readFile(`${mdFolderPath}/description.mdx`, 'utf-8'),
            usage: await readFile(`${mdFolderPath}/usage.mdx`, 'utf-8'),
            examples: await readFile(`${mdFolderPath}/examples.mdx`, 'utf-8'),
        })
        const llmMarkdownPath = `${mdFolderPath}/llm.mdx`
        await writeFile(llmMarkdownPath, llmMarkdownContent)
        console.log(`    ✓ Generated LLM markdown`)

        console.log(`  ✓ Processed: ${name}`)
    }

    console.log(`\n📁 Metadata saved to: ../wiki/src/content/components/`)
    console.log(`📁 Markdown files saved to: ../wiki/src/content/md/`)
    console.log("\n✅ Done!")
}

main().catch(console.error)
