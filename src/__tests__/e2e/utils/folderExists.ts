import * as fs from "fs/promises";
import * as path from "path";

/**
 * Helper function to check if folder exists
 */
export async function folderExists(
  projectRoot: string,
  relativePath: string,
): Promise<boolean> {
  try {
    const folderPath = path.join(projectRoot, ".trellis", relativePath);
    const stats = await fs.stat(folderPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
