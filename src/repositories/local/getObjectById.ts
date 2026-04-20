import { readFile } from "fs/promises";
import { TrellisObject } from "../../models";
import { deserializeTrellisObject } from "../../utils/deserializeTrellisObject";
import { getChildrenByFilePath } from "./getChildrenByFilePath";
import { RepoIndex } from "./RepoIndex";

/**
 * Gets a TrellisObject by its ID using the RepoIndex cache.
 *
 * On a warm hit: single file read, no directory scan. On a miss: repopulates
 * the index (detecting external writes from other MCP instances) and retries.
 */
export async function getObjectById(
  id: string,
  planningRoot: string,
): Promise<TrellisObject | null> {
  let entry = await RepoIndex.lookup(planningRoot, id);
  if (!entry) {
    await RepoIndex.populate(planningRoot);
    entry = await RepoIndex.lookup(planningRoot, id);
  }
  if (!entry) return null;

  try {
    const fileContent = await readFile(entry.filePath, "utf-8");
    const trellisObject = deserializeTrellisObject(fileContent);
    trellisObject.childrenIds = await getChildrenByFilePath(entry.filePath);
    return trellisObject;
  } catch (error) {
    console.error(
      `Warning: Could not deserialize file ${entry.filePath}:`,
      error,
    );
    return null;
  }
}
