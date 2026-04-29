import { access, unlink } from "fs/promises";
import { join } from "path";
import { assertSafeFilename } from "./assertSafeFilename";
import { getProjectFilesFolder } from "./getProjectFilesFolder";

/** Deletes a named file from the project files directory. Throws with a user-friendly message if the file does not exist. */
export async function deleteProjectFile(
  filename: string,
  planningRoot: string,
): Promise<void> {
  assertSafeFilename(filename);
  const folder = getProjectFilesFolder(planningRoot);
  const filePath = join(folder, filename);
  try {
    await access(filePath);
  } catch {
    throw new Error(`Project file '${filename}' does not exist`);
  }
  await unlink(filePath);
}
