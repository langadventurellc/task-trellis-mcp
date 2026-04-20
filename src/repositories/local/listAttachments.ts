import { readdir } from "fs/promises";
import { type TrellisObject } from "../../models";
import { getAttachmentsFolder } from "./getAttachmentsFolder";

/** Returns filenames of all attachments for an issue. Returns [] if no folder exists or the parent chain is broken. */
export async function listAttachments(
  obj: TrellisObject,
  planningRoot: string,
): Promise<string[]> {
  let folder: string;
  try {
    folder = await getAttachmentsFolder(obj, planningRoot);
  } catch {
    return [];
  }
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
