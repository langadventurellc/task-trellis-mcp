import * as fs from "fs/promises";
import * as path from "path";
import { resolveDataDir } from "../../../configuration/resolveDataDir";
import { resolveProjectKey } from "../../../configuration/resolveProjectKey";

/**
 * Helper function to check if folder exists within the project's data dir
 */
export async function folderExists(
  projectRoot: string,
  relativePath: string,
): Promise<boolean> {
  try {
    const folderPath = path.join(
      resolveDataDir(),
      "projects",
      resolveProjectKey(projectRoot),
      relativePath,
    );
    const stats = await fs.stat(folderPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
