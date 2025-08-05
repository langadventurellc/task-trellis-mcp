import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { TrellisObject } from "../../models/TrellisObject";
import { serializeTrellisObject } from "../../utils/serializeTrellisObject";
import { getObjectFilePath } from "./getObjectFilePath";

/**
 * Saves a Trellis object to the file system.
 * Determines the file path using getObjectFilePath and creates necessary directories.
 * Overwrites existing files if they exist.
 *
 * @param trellisObject - The TrellisObject to save
 * @param planningRoot - The root directory for the planning structure
 * @returns Promise<string> - The file path where the object was saved
 */
export async function saveObject(
  trellisObject: TrellisObject,
  planningRoot: string,
): Promise<string> {
  const filePath = await getObjectFilePath(trellisObject, planningRoot);
  const serializedContent = serializeTrellisObject(trellisObject);

  // Ensure the directory exists before writing the file
  const dirPath = dirname(filePath);
  await mkdir(dirPath, { recursive: true });

  // Write the serialized content to the file (overwrites if exists)
  await writeFile(filePath, serializedContent, "utf8");

  return filePath;
}
