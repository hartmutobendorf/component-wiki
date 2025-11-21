/**
 * Coda API configuration
 */
export const CODA_CONFIG = {
  /**
   * Base URL for the Coda API
   */
  baseUrl: "https://coda.io/apis/v1",

  /**
   * API token from environment variable
   * Get your token at: https://coda.io/account
   */
  getApiToken: () => process.env.CODA_API_TOKEN,

  /**
   * Doc ID from environment variable
   * The ID of the doc you want to retrieve content from
   */
  getDocId: () => process.env.CODA_DOC_ID,

  /**
   * Table ID from environment variable
   * The ID of the table you want to retrieve data from
   */
  getTableId: () => process.env.CODA_TABLE_ID,

  /**
   * Change log table ID from environment variable
   * The ID of the change log table
   */
  getChangeLogTableId: () => process.env.CODA_CHANGELOG_TABLE_ID,
} as const;
