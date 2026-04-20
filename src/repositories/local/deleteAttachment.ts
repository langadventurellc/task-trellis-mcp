import { access, unlink } from "fs/promises";
import { join } from "path";
import { getAttachmentsFolder } from "./getAttachmentsFolder";

/**
 * Deletes a named file from the issue's attachments folder.
 * Throws if the issue does not exist or the file does not exist.
 */
export async function deleteAttachment(
  id: string,
  filename: string,
  planningRoot: string,
): Promise<void> {
  // getAttachmentsFolder throws if issue not found
  const folder = await getAttachmentsFolder(id, planningRoot);
  const filePath = join(folder, filename);

  try {
    await access(filePath);
  } catch {
    throw new Error(
      `File '${filename}' does not exist in attachments for ${id}`,
    );
  }

  await unlink(filePath);
}
