import { createCodaClient } from "./client"
import { createServices } from "./services"

/**
 * Default Coda instance with client initialized from environment
 */
export const coda = createServices(
    createCodaClient(process.env.CODA_API_TOKEN!)
)
