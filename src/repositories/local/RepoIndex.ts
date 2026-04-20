import { readFile, stat } from "fs/promises";
import { findMarkdownFiles } from "./findMarkdownFiles";
import { RepoIndexEntry } from "./RepoIndexEntry";

const ID_LINE = /^id:\s+(\S+)/m;

/**
 * Per-planning-root cache mapping object ID → file location + last-seen mtime.
 *
 * Shared across all callers in this process; tolerant of writes made by other
 * MCP server instances via `lookup`'s stat-based staleness check.
 */
export class RepoIndex {
  private static readonly buckets = new Map<
    string,
    Map<string, RepoIndexEntry>
  >();

  /**
   * Returns a validated entry, or null if missing or stale.
   *
   * Before returning a cached entry, `stat`s the file to confirm it still
   * exists and its mtime matches; on mismatch the entry is evicted.
   */
  static async lookup(
    planningRoot: string,
    id: string,
  ): Promise<RepoIndexEntry | null> {
    const bucket = RepoIndex.buckets.get(planningRoot);
    if (!bucket) return null;
    const entry = bucket.get(id);
    if (!entry) return null;
    try {
      const stats = await stat(entry.filePath);
      if (stats.mtimeMs !== entry.mtime) {
        bucket.delete(id);
        return null;
      }
      return entry;
    } catch {
      bucket.delete(id);
      return null;
    }
  }

  /**
   * Scans every markdown file under the planning root and rebuilds the id→file map.
   * Uses an id-only regex prefilter; never full-YAML-parses a file.
   */
  static async populate(planningRoot: string): Promise<void> {
    const files = await findMarkdownFiles(planningRoot, true);
    const bucket = new Map<string, RepoIndexEntry>();
    for (const filePath of files) {
      try {
        const content = await readFile(filePath, "utf-8");
        const match = content.match(ID_LINE);
        if (!match) continue;
        const id = match[1];
        const stats = await stat(filePath);
        bucket.set(id, { filePath, mtime: stats.mtimeMs });
      } catch {
        // Skip files that can't be read; populate is best-effort.
      }
    }
    RepoIndex.buckets.set(planningRoot, bucket);
  }

  /** Removes a single id from the cache. No-op if absent. */
  static invalidate(planningRoot: string, id: string): void {
    RepoIndex.buckets.get(planningRoot)?.delete(id);
  }

  /** Drops the entire bucket for a planning root. */
  static invalidateAll(planningRoot: string): void {
    RepoIndex.buckets.delete(planningRoot);
  }

  /** Returns a snapshot of current entries for the root. */
  static entries(planningRoot: string): Array<[string, RepoIndexEntry]> {
    const bucket = RepoIndex.buckets.get(planningRoot);
    if (!bucket) return [];
    return Array.from(bucket.entries());
  }
}
