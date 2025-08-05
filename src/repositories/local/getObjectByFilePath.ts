import { readFile } from "fs/promises";
import { TrellisObject } from "../../models";
import { deserializeTrellisObject } from "../../utils/deserializeTrellisObject";

/**
 * Gets a TrellisObject by reading and deserializing a specific markdown file
 * @param filePath The full path to the markdown file to read
 * @returns Promise resolving to the TrellisObject from the file
 * @throws Error if file reading fails or deserialization fails
 */
export async function getObjectByFilePath(
  filePath: string,
): Promise<TrellisObject> {
  const fileContent = await readFile(filePath, "utf-8");
  return deserializeTrellisObject(fileContent);
}
