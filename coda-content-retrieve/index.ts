import * as cheerio from "cheerio"
import TurndownService from "turndown"
import { coda } from "./src/coda"
import { CODA_CONFIG } from "./src/config/coda"

interface RowData {
    name: string
    "documentation-status": string
    type: string
    tiers: string
    "last-edited": string
    usage: string
    description: string
    anatomy: string
    examples: string
    "figma-link": string
    "code-link": string
}

// Helper function to download an image and return the filename from headers
async function downloadImage(
    url: string,
    folderPath: string
): Promise<string> {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()

    // Get filename from x-amz-meta-filename header
    const filename = response.headers.get("x-amz-meta-filename") || "image.jpg"

    const filePath = `${folderPath}/${filename}`
    await Bun.write(filePath, buffer)

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
            anatomy: "",
            examples: "",
            "figma-link": "",
            "code-link": "",
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

        // Extract HTML for rich content fields - we'll convert these to markdown later
        const descriptionCell = cells.eq(columnMap["Description"])
        rowData.description = descriptionCell.html() || ""

        const anatomyCell = cells.eq(columnMap["Anatomy"])
        rowData.anatomy = anatomyCell.html() || ""

        const examplesCell = cells.eq(columnMap["Examples"])
        rowData.examples = examplesCell.html() || ""

        const usageCell = cells.eq(columnMap["Usage"])
        rowData.usage = usageCell.html() || ""

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

async function main() {
    const docId = CODA_CONFIG.getDocId()
    const tableId = CODA_CONFIG.getTableId()

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
    const rowsData = extractTableData(pageHtml)

    // Create components metadata directory
    await Bun.$`mkdir -p ../app/src/content/components`

    // Process rows and create markdown files
    console.log("\n📝 Processing rows and creating markdown files...")

    for (const row of rowsData) {
        const name = row.name
        const folderName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        const mdFolderPath = `../app/src/content/md/${folderName}`
        const imagesFolderPath = `${mdFolderPath}/images`

        // Create directories
        await Bun.$`mkdir -p ${imagesFolderPath}`

        console.log(`  Processing: ${name}`)

        // Convert HTML fields to Markdown and handle images
        const contentFields = [
            { key: "usage", fileName: "usage.md" },
            { key: "description", fileName: "description.md" },
            { key: "anatomy", fileName: "anatomy.md" },
            { key: "examples", fileName: "examples.md" },
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
            await Bun.write(markdownPath, markdown)
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
        }

        const metadataPath = `../app/src/content/components/${folderName}.json`
        await Bun.write(
            metadataPath,
            JSON.stringify(componentMetadata, null, 2)
        )

        console.log(`  ✓ Processed: ${name}`)
    }

    console.log(`\n📁 Metadata saved to: ../app/src/content/components/`)
    console.log(`📁 Markdown files saved to: ../app/src/content/md/`)
    console.log("\n✅ Done!")
}

main().catch(console.error)
