import { TrellisObject } from "../../models";
import { isOpen } from "../../models/isOpen";

/**
 * Get all child objects of a given parent ID from the local repository
 *
 * @param parentId - ID of the parent object to find children for
 * @param planningRootFolder - Path to the planning root folder
 * @param includeClosed - Whether to include closed children (default: false)
 * @returns Array of child TrellisObjects
 */
export async function getChildrenOf(
  parentId: string,
  planningRootFolder: string,
  includeClosed = false,
): Promise<TrellisObject[]> {
  const { findMarkdownFiles } = await import("./findMarkdownFiles");
  const { getObjectByFilePath } = await import("./getObjectByFilePath");

  // Get all files - we need to check all objects to find children
  const markdownFiles = await findMarkdownFiles(
    planningRootFolder,
    true, // Always include closed files, we'll filter by status later
  );

  const children: TrellisObject[] = [];

  for (const filePath of markdownFiles) {
    try {
      const trellisObject = await getObjectByFilePath(filePath);

      // Check if this object is a child of the specified parent
      if (trellisObject.parent !== parentId) {
        continue; // Skip if not a child of the specified parent
      }

      // Apply includeClosed filter
      if (!includeClosed && !isOpen(trellisObject)) {
        continue; // Skip closed objects if includeClosed is false
      }

      children.push(trellisObject);
    } catch (error) {
      // Skip files that can't be deserialized (might not be valid Trellis objects)
      console.error(`Warning: Could not deserialize file ${filePath}:`, error);
      continue;
    }
  }

  return children;
}
