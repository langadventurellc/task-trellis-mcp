import * as fs from "fs/promises";

/**
 * Helper function to check if absolute folder path exists
 */
export async function pathExists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}
