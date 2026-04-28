import { readdir } from "fs/promises";
import { getProjectFilesFolder } from "./getProjectFilesFolder";

/** Lists filenames in the project files directory. Returns [] if the directory does not yet exist. */
export async function listProjectFiles(
  planningRoot: string,
): Promise<string[]> {
  const folder = getProjectFilesFolder(planningRoot);
  try {
    const entries = await readdir(folder, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
