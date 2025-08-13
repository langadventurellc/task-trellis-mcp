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
  Object.entries(filesChanged).forEach(([filePath, description]) => {
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
