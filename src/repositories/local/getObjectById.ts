import { readFile } from "fs/promises";
import { TrellisObject } from "../../models";
import { deserializeTrellisObject } from "../../utils/deserializeTrellisObject";
import { findMarkdownFiles } from "./findMarkdownFiles";

/**
 * Gets a TrellisObject by its ID by searching through markdown files
 * @param id The ID of the object to find
 * @param planningRoot The root directory to search for markdown files
 * @returns Promise resolving to the TrellisObject with the matching ID
 * @throws Error if no object with the given ID is found or if file reading fails
 */
export async function getObjectById(
  id: string,
  planningRoot: string,
): Promise<TrellisObject> {
  // Find all markdown files in the planning root
  const markdownFiles = await findMarkdownFiles(planningRoot);

  // Search through each markdown file to find the one with the matching ID
  for (const filePath of markdownFiles) {
    try {
      const fileContent = await readFile(filePath, "utf-8");
      const trellisObject = deserializeTrellisObject(fileContent);

      // Check if this object has the ID we're looking for
      if (trellisObject.id === id) {
        return trellisObject;
      }
    } catch (error) {
      // Skip files that can't be deserialized (might not be valid Trellis objects)
      console.warn(`Warning: Could not deserialize file ${filePath}:`, error);
      continue;
    }
  }

  // If we get here, no object with the given ID was found
  throw new Error(`No object found with ID: ${id}`);
}
