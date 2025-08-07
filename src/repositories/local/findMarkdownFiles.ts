import { readdir, stat } from "fs/promises";
import { join } from "path";
import { matchesScope } from "./scopeFilter";

/**
 * Recursively finds all markdown files in a directory and its subdirectories
 * @param folderPath The root folder path to search
 * @param includeClosed Optional flag to include files in closed task folders (paths containing "/t/closed"), defaults to true
 * @param scope Optional scope ID to filter results to children of that scope object (e.g., "P-project-id", "E-epic-id", "F-feature-id")
 * @returns Promise resolving to an array of full paths to markdown files
 */
export async function findMarkdownFiles(
  folderPath: string,
  includeClosed?: boolean,
  scope?: string,
): Promise<string[]> {
  const markdownFiles: string[] = [];

  async function scanDirectory(currentPath: string): Promise<void> {
    try {
      const entries = await readdir(currentPath);

      for (const entry of entries) {
        const fullPath = join(currentPath, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (stats.isFile() && entry.toLowerCase().endsWith(".md")) {
          // If includeClosed is false, skip files in closed task folders
          if (includeClosed === false && fullPath.includes("/t/closed")) {
            return;
          }

          // If scope is provided, filter files to only include those within the scope
          if (scope && !matchesScope(fullPath, scope)) {
            // console.log(`Skipping file ${fullPath} not in scope ${scope}`);
            continue;
          }

          markdownFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read (permissions, etc.)
      // Don't warn for ENOENT errors as directories may not exist yet
      if (
        error instanceof Error &&
        "code" in error &&
        error.code !== "ENOENT"
      ) {
        console.error(
          `Warning: Could not read directory ${currentPath}:`,
          error,
        );
      }
    }
  }

  await scanDirectory(folderPath);
  return markdownFiles.sort();
}
