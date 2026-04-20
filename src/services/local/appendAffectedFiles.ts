import { TrellisObject } from "../../models/TrellisObject.js";
import { Repository } from "../../repositories/index.js";

/**
 * Appends affected files to a trellis object, merging descriptions for existing files.
 * Recursively updates parent objects if they exist.
 *
 * @param repository - The repository instance to fetch parent objects
 * @param trellisObject - The trellis object to update
 * @param filesChanged - Record of file paths to descriptions
 */
export async function appendAffectedFiles(
  repository: Repository,
  trellisObject: TrellisObject,
  filesChanged: Record<string, string>,
): Promise<void> {
  if (
    typeof filesChanged !== "object" ||
    filesChanged === null ||
    Array.isArray(filesChanged)
  ) {
    throw new Error(
      "filesChanged must be a plain object mapping file paths to descriptions",
    );
  }

  const entries = Object.entries(filesChanged);

  if (entries.length > 500) {
    throw new Error(
      `filesChanged exceeds maximum of 500 entries (got ${entries.length})`,
    );
  }

  for (const [key] of entries) {
    if (key.length < 2) {
      throw new Error(
        `filesChanged contains invalid key "${key}": keys must be at least 2 characters long`,
      );
    }
    if (/^\d+$/.test(key)) {
      throw new Error(
        `filesChanged contains invalid key "${key}": numeric-string keys are not allowed`,
      );
    }
  }

  entries.forEach(([filePath, description]) => {
    const existingDescription = trellisObject.affectedFiles.get(filePath);

    if (existingDescription) {
      // Merge descriptions with a separator
      const mergedDescription = `${existingDescription}; ${description}`;
      trellisObject.affectedFiles.set(filePath, mergedDescription);
    } else {
      // Add new file
      trellisObject.affectedFiles.set(filePath, description);
    }
  });

  // If this object has a parent, recursively update the parent with the same files
  if (trellisObject.parent) {
    const parent = await repository.getObjectById(trellisObject.parent);
    if (parent) {
      await appendAffectedFiles(repository, parent, filesChanged);
      await repository.saveObject(parent);
    }
  }
}
