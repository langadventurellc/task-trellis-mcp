import { readdir, stat } from "fs/promises";
import { join } from "path";

/**
 * Recursively finds all markdown files in a directory and its subdirectories
 * @param folderPath The root folder path to search
 * @returns Promise resolving to an array of full paths to markdown files
 */
export async function findMarkdownFiles(folderPath: string): Promise<string[]> {
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
          markdownFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read (permissions, etc.)
      console.warn(`Warning: Could not read directory ${currentPath}:`, error);
    }
  }

  await scanDirectory(folderPath);
  return markdownFiles.sort();
}
