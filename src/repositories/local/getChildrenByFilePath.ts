import { readdir, stat } from "node:fs/promises";
import { dirname, join, basename } from "node:path";
import { getObjectByFilePath } from "./getObjectByFilePath";

/**
 * Determines the child folders based on the object type prefix
 */
function getChildFolders(parentDir: string, objectPrefix: string): string[] {
  switch (objectPrefix) {
    case "P":
      // Projects have epics in e/ subfolder
      return [join(parentDir, "e")];
    case "E":
      // Epics have features in f/ subfolder
      return [join(parentDir, "f")];
    case "F":
      // Features have tasks in t/open/ and t/closed/ subfolders
      return [join(parentDir, "t", "open"), join(parentDir, "t", "closed")];
    default:
      // Tasks (T) and unknown types have no children
      return [];
  }
}

/**
 * Scans a folder for child objects (handles both directory-based and file-based structures)
 */
async function scanFolderForChildren(folder: string): Promise<string[]> {
  const children: string[] = [];

  try {
    const entries = await readdir(folder);

    for (const entry of entries) {
      const fullPath = join(folder, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        // For P, E, F objects, the markdown file is inside a folder with the same name
        // e.g., e/E-epic-name/E-epic-name.md
        const mdFilePath = join(fullPath, `${entry}.md`);
        try {
          const mdStats = await stat(mdFilePath);
          if (mdStats.isFile()) {
            const childObject = await getObjectByFilePath(mdFilePath);
            children.push(childObject.id);
          }
        } catch {
          // File doesn't exist, skip
        }
      } else if (stats.isFile() && entry.endsWith(".md")) {
        // For tasks in open/closed folders, the markdown files are directly in those folders
        const childObject = await getObjectByFilePath(fullPath);
        children.push(childObject.id);
      }
    }
  } catch (error) {
    // Folder doesn't exist or can't be read, skip silently
    if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
      console.error(`Warning: Could not read directory ${folder}:`, error);
    }
  }

  return children;
}

/**
 * Gets all child object IDs for a given Trellis object file path.
 *
 * @param filePath - The file path to a Trellis object markdown file
 * @returns Array of child object IDs
 *
 * Hierarchy:
 * - Projects (P-*) can have Epics (E-*) as children in e/ subfolder
 * - Epics (E-*) can have Features (F-*) as children in f/ subfolder
 * - Features (F-*) can have Tasks (T-*) as children in t/open/ and t/closed/ subfolders
 * - Tasks (T-*) have no children
 */
export async function getChildrenByFilePath(
  filePath: string,
): Promise<string[]> {
  const parentDir = dirname(filePath);
  const fileName = basename(filePath, ".md");

  // Determine object type from filename prefix
  const objectPrefix = fileName.charAt(0).toUpperCase();

  // Get the folders where children might be located
  const childFolders = getChildFolders(parentDir, objectPrefix);

  // Scan each child folder for markdown files
  const children: string[] = [];
  for (const folder of childFolders) {
    const folderChildren = await scanFolderForChildren(folder);
    children.push(...folderChildren);
  }

  return children;
}
