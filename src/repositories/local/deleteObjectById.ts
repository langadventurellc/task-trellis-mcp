import { readFile, unlink, rm } from "fs/promises";
import { dirname } from "path";
import { deserializeTrellisObject } from "../../utils/deserializeTrellisObject";
import { findMarkdownFiles } from "./findMarkdownFiles";

/**
 * Deletes a TrellisObject by its ID, including both the markdown file and associated folder
 * @param id The ID of the object to delete
 * @param planningRoot The root directory to search for markdown files
 * @returns Promise resolving when the object is successfully deleted
 * @throws Error if no object with the given ID is found or if deletion fails
 */
export async function deleteObjectById(
  id: string,
  planningRoot: string,
): Promise<void> {
  // Find all markdown files in the planning root
  const markdownFiles = await findMarkdownFiles(planningRoot);

  // Search through each markdown file to find the one with the matching ID
  let targetFilePath: string | null = null;

  for (const filePath of markdownFiles) {
    try {
      const fileContent = await readFile(filePath, "utf-8");
      const trellisObject = deserializeTrellisObject(fileContent);

      // Check if this object has the ID we're looking for
      if (trellisObject.id === id) {
        targetFilePath = filePath;
        break;
      }
    } catch (error) {
      // Skip files that can't be deserialized (might not be valid Trellis objects)
      console.warn(`Warning: Could not deserialize file ${filePath}:`, error);
      continue;
    }
  }

  if (!targetFilePath) {
    throw new Error(`No object found with ID: ${id}`);
  }

  // Delete the markdown file
  await unlink(targetFilePath);

  // If this is a project, epic, or feature, also delete the associated folder
  if (id.startsWith("P-") || id.startsWith("E-") || id.startsWith("F-")) {
    // The folder to delete is the parent directory of the markdown file
    // For example: .trellis/f/F-user-authentication/F-user-authentication.md
    // We want to delete: .trellis/f/F-user-authentication/
    const associatedFolderPath = dirname(targetFilePath);

    try {
      // Delete the folder and all its contents recursively
      await rm(associatedFolderPath, { recursive: true, force: true });
    } catch (error) {
      // If the folder doesn't exist or can't be deleted, log a warning but don't fail
      console.warn(
        `Warning: Could not delete associated folder ${associatedFolderPath}:`,
        error,
      );
    }
  }
}
