import { coda } from "./src/coda"
import { CODA_CONFIG } from "./src/config/coda"

async function listAllTables() {
    const docId = CODA_CONFIG.getDocId()

    if (!docId) {
        console.error("Error: CODA_DOC_ID environment variable is not set")
        console.log("Please add CODA_DOC_ID to your .env file")
        return
    }

    console.log(`\nFetching all tables from doc: ${docId}\n`)

    try {
        const tablesResponse = await coda.listTables(docId)
        const tables = (tablesResponse as any).items || []

        console.log(`Found ${tables.length} tables:\n`)
        console.log("=" .repeat(80))

        for (const table of tables) {
            console.log(`\nTable Name: ${table.name}`)
            console.log(`Table ID: ${table.id}`)
            console.log(`Type: ${table.tableType}`)
            if (table.parent) {
                console.log(`Parent Page: ${table.parent.name} (${table.parent.id})`)
            }
            console.log("-".repeat(80))
        }

        console.log("\n✅ Done! Copy the table ID you need and add it to your .env file")
    } catch (error) {
        console.error("Error fetching tables:", error)
    }
}

listAllTables().catch(console.error)
