import { readFile, unlink, rm } from "fs/promises";
import { dirname } from "path";
import { deserializeTrellisObject } from "../../utils/deserializeTrellisObject";
import { findMarkdownFiles } from "./findMarkdownFiles";
import { isRequiredForOtherObjects } from "../../utils/isRequiredForOtherObjects";
import { ServerConfig } from "../../configuration/ServerConfig";

/**
 * Deletes a TrellisObject by its ID, including both the markdown file and associated folder
 *
 * By default, the function checks if the object is required by other objects (as a prerequisite)
 * and throws an error if it is. This safety check can be bypassed using the force parameter.
 *
 * @param id The ID of the object to delete
 * @param planningRoot The root directory to search for markdown files
 * @param force Optional. If true, bypasses dependency checks and deletes the object even if required by others. Defaults to false.
 * @returns Promise resolving when the object is successfully deleted
 * @throws Error if no object with the given ID is found
 * @throws Error if object is required by other objects and force is false
 * @throws Error if deletion fails due to file system issues
 */
export async function deleteObjectById(
  id: string,
  planningRoot: string,
  force?: boolean,
): Promise<void> {
  // Find all markdown files in the planning root
  const markdownFiles = await findMarkdownFiles(planningRoot);

  // Search through each markdown file to find the one with the matching ID
  let targetFilePath: string | null = null;
  let targetObject = null;

  for (const filePath of markdownFiles) {
    try {
      const fileContent = await readFile(filePath, "utf-8");
      const trellisObject = deserializeTrellisObject(fileContent);

      // Check if this object has the ID we're looking for
      if (trellisObject.id === id) {
        targetFilePath = filePath;
        targetObject = trellisObject;
        break;
      }
    } catch (error) {
      // Skip files that can't be deserialized (might not be valid Trellis objects)
      console.warn(`Warning: Could not deserialize file ${filePath}:`, error);
      continue;
    }
  }

  if (!targetFilePath || !targetObject) {
    throw new Error(`No object found with ID: ${id}`);
  }

  // Check if the object is required for other objects unless force is true
  if (!force) {
    // Create a LocalRepository instance to check dependencies
    const { LocalRepository } = await import("./LocalRepository");
    const config: ServerConfig = {
      mode: "local",
      planningRootFolder: planningRoot,
    };
    const repository = new LocalRepository(config);

    const isRequired = await isRequiredForOtherObjects(
      targetObject,
      repository,
    );
    if (isRequired) {
      throw new Error(
        `Cannot delete object ${id} because it is required by other objects. Use force=true to override.`,
      );
    }
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
