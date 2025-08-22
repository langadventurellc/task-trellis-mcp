import { TrellisObject } from "../models/TrellisObject";
import { Repository } from "../repositories/Repository";
import { checkPrerequisitesComplete } from "./checkPrerequisitesComplete";

/**
 * Checks if all prerequisites for a trellis object and its entire parent hierarchy are complete.
 * This function recursively traverses up the parent hierarchy to ensure that if a parent has
 * incomplete prerequisites, all its child tasks are excluded from being claimable.
 *
 * @param trellisObject - The trellis object to check prerequisites for
 * @param repository - The repository to load prerequisite and parent objects from
 * @param visitedIds - Set to prevent circular references (default: new Set())
 * @returns Promise<boolean> - true if all prerequisites at all hierarchy levels are complete, false otherwise
 */
export async function checkHierarchicalPrerequisitesComplete(
  trellisObject: TrellisObject,
  repository: Repository,
  visitedIds: Set<string> = new Set(),
): Promise<boolean> {
  // Prevent infinite loops from circular references
  if (visitedIds.has(trellisObject.id)) {
    return true;
  }

  visitedIds.add(trellisObject.id);

  // First check the object's own prerequisites
  const ownPrerequisitesComplete = await checkPrerequisitesComplete(
    trellisObject,
    repository,
  );

  if (!ownPrerequisitesComplete) {
    return false;
  }

  // If the object has a parent, recursively check its prerequisites
  if (trellisObject.parent) {
    try {
      const parent = await repository.getObjectById(trellisObject.parent);

      // If parent doesn't exist, treat as complete (graceful handling)
      if (!parent) {
        return true;
      }

      // Recursively check parent's hierarchical prerequisites
      const parentPrerequisitesComplete =
        await checkHierarchicalPrerequisitesComplete(
          parent,
          repository,
          visitedIds,
        );

      if (!parentPrerequisitesComplete) {
        return false;
      }
    } catch {
      // If we can't load the parent, treat as complete (graceful handling)
      return true;
    }
  }

  return true;
}
