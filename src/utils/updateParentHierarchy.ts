import { TrellisObjectStatus } from "../models";
import { Repository } from "../repositories";

/**
 * Updates the parent hierarchy to in-progress status when a task becomes in-progress.
 * This ensures that parent objects reflect that work is being done on their children.
 *
 * @param parentId - The ID of the parent object to update
 * @param repository - The repository instance
 * @param visitedIds - Set of visited IDs to prevent infinite recursion
 */
export async function updateParentHierarchy(
  parentId: string | undefined,
  repository: Repository,
  visitedIds: Set<string> = new Set(),
): Promise<void> {
  if (!parentId) {
    return;
  }

  // Prevent infinite recursion by checking if we've already visited this ID
  if (visitedIds.has(parentId)) {
    return;
  }
  visitedIds.add(parentId);

  const parent = await repository.getObjectById(parentId);
  if (!parent) {
    return;
  }

  // If parent is already in progress, we can stop here since we assume
  // its parent is already in progress too
  if (parent.status === TrellisObjectStatus.IN_PROGRESS) {
    return;
  }

  // Update parent to in-progress
  const updatedParent = {
    ...parent,
    status: TrellisObjectStatus.IN_PROGRESS,
  };

  await repository.saveObject(updatedParent);

  // Continue up the hierarchy
  await updateParentHierarchy(parent.parent, repository, visitedIds);
}
