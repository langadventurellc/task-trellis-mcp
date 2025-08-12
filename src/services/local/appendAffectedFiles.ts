import { TrellisObject } from "../../models/TrellisObject.js";

/**
 * Appends affected files to a trellis object, merging descriptions for existing files.
 *
 * @param trellisObject - The trellis object to update
 * @param filesChanged - Record of file paths to descriptions
 */
export function appendAffectedFiles(
  trellisObject: TrellisObject,
  filesChanged: Record<string, string>,
): void {
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
}
