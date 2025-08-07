import { readFile, rm, unlink } from "fs/promises";
import { dirname } from "path";
import { ServerConfig } from "../../configuration";
import { TrellisObject } from "../../models";
import {
  deserializeTrellisObject,
  isRequiredForOtherObjects,
} from "../../utils";
import { findMarkdownFiles } from "./findMarkdownFiles";

interface FoundObject {
  filePath: string;
  object: TrellisObject;
}

async function findObjectById(
  id: string,
  planningRoot: string,
): Promise<FoundObject> {
  const markdownFiles = await findMarkdownFiles(planningRoot);

  for (const filePath of markdownFiles) {
    try {
      const fileContent = await readFile(filePath, "utf-8");
      const trellisObject: TrellisObject =
        deserializeTrellisObject(fileContent);

      if (trellisObject.id === id) {
        return { filePath, object: trellisObject };
      }
    } catch (error) {
      console.error(`Warning: Could not deserialize file ${filePath}:`, error);
      continue;
    }
  }

  throw new Error(`No object found with ID: ${id}`);
}

async function checkObjectDependencies(
  targetObject: TrellisObject,
  planningRoot: string,
): Promise<void> {
  const { LocalRepository } = await import("./LocalRepository");
  const config: ServerConfig = {
    mode: "local",
    planningRootFolder: planningRoot,
  };
  const repository = new LocalRepository(config);

  const isRequired = await isRequiredForOtherObjects(targetObject, repository);
  if (isRequired) {
    throw new Error(
      `Cannot delete object ${targetObject.id} because it is required by other objects. Use force=true to override.`,
    );
  }
}

async function deleteObjectFile(filePath: string): Promise<void> {
  await unlink(filePath);
}

async function deleteAssociatedFolder(
  id: string,
  filePath: string,
): Promise<void> {
  if (!id.startsWith("P-") && !id.startsWith("E-") && !id.startsWith("F-")) {
    return;
  }

  const associatedFolderPath = dirname(filePath);

  try {
    await rm(associatedFolderPath, { recursive: true, force: true });
  } catch (error) {
    console.error(
      `Warning: Could not delete associated folder ${associatedFolderPath}:`,
      error,
    );
  }
}

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
  const foundObject = await findObjectById(id, planningRoot);
  const { filePath, object } = foundObject;

  if (!force) {
    await checkObjectDependencies(object, planningRoot);
  }

  await deleteObjectFile(filePath);
  await deleteAssociatedFolder(id, filePath);
}
