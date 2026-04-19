import * as fs from "fs/promises";
import * as path from "path";
import { resolveDataDir } from "../../../configuration/resolveDataDir";
import { resolveProjectKey } from "../../../configuration/resolveProjectKey";

/**
 * Helper function to check if file exists
 */
export async function fileExists(
  projectRoot: string,
  relativePath: string,
): Promise<boolean> {
  try {
    const filePath = path.join(
      resolveDataDir(),
      "projects",
      resolveProjectKey(projectRoot),
      relativePath,
    );
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
