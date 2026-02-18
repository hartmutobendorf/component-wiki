/**
 * Minimal sync config types needed by the transform package.
 * Mirrors the relevant parts of @wiki/coda-sync's config.
 */

export interface TableConfig {
  id: string;
  pageId?: string;
  htmlColumns?: string[];
  relatesTo?: string | string[];
}

export interface SyncConfig {
  baseUrl: string;
  docId: string;
  tables: Record<string, TableConfig>;
}
