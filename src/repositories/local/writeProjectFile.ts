import { access, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { assertSafeFilename } from "./assertSafeFilename";
import { getProjectFilesFolder } from "./getProjectFilesFolder";

/** Writes a UTF-8 text file to the project files directory. Creates the directory on demand. When `failIfExists` is true, throws if a file with that name already exists. */
export async function writeProjectFile(
  filename: string,
  content: string,
  planningRoot: string,
  failIfExists?: boolean,
): Promise<void> {
  assertSafeFilename(filename);
  const folder = getProjectFilesFolder(planningRoot);
  const destPath = join(folder, filename);

  if (failIfExists) {
    try {
      await access(destPath);
      throw new Error(`Project file '${filename}' already exists`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  await mkdir(folder, { recursive: true });
  await writeFile(destPath, content, { encoding: "utf8" });
}
