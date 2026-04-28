import { readFile } from "fs/promises";
import { join } from "path";
import { assertSafeFilename } from "./assertSafeFilename";
import { getProjectFilesFolder } from "./getProjectFilesFolder";

/** Reads a UTF-8 text file from the project files directory. Throws with a user-friendly message on ENOENT. */
export async function readProjectFile(
  filename: string,
  planningRoot: string,
): Promise<string> {
  assertSafeFilename(filename);
  const folder = getProjectFilesFolder(planningRoot);
  const filePath = join(folder, filename);
  try {
    return await readFile(filePath, { encoding: "utf8" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Project file '${filename}' does not exist`);
    }
    throw error;
  }
}
