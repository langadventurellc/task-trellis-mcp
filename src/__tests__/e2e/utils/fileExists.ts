import * as fs from "fs/promises";
import * as path from "path";

/**
 * Helper function to check if file exists
 */
export async function fileExists(
  projectRoot: string,
  relativePath: string,
): Promise<boolean> {
  try {
    const filePath = path.join(projectRoot, ".trellis", relativePath);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
