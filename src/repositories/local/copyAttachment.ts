import { access, copyFile, mkdir } from "fs/promises";
import { basename, join } from "path";
import { getAttachmentsFolder } from "./getAttachmentsFolder";
import { getObjectById } from "./getObjectById";

/**
 * Copies a file into the managed attachments folder for an issue.
 * Throws if the issue does not exist, source file does not exist,
 * or a file with that basename already exists in the folder.
 * Returns the stored filename.
 */
export async function copyAttachment(
  id: string,
  sourcePath: string,
  planningRoot: string,
): Promise<string> {
  try {
    await access(sourcePath);
  } catch {
    throw new Error(`Source file '${sourcePath}' does not exist`);
  }

  const obj = await getObjectById(id, planningRoot);
  if (!obj) throw new Error(`Object with ID '${id}' not found`);
  const folder = await getAttachmentsFolder(obj, planningRoot);
  const filename = basename(sourcePath);
  const destPath = join(folder, filename);

  let destExists = false;
  try {
    await access(destPath);
    destExists = true;
  } catch {
    // ENOENT — no collision
  }
  if (destExists) {
    throw new Error(
      `File '${filename}' already exists in attachments for ${id}`,
    );
  }

  await mkdir(folder, { recursive: true });
  await copyFile(sourcePath, destPath);

  return filename;
}
