import {
  TrellisObject,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../models";
import { Repository } from "../repositories";

/**
 * Auto-completes parent objects when all their children are done or won't-do.
 * This recursively moves up the hierarchy, marking parents as done when appropriate.
 *
 * @param repository - The repository instance
 * @param completedObject - The object that was just completed
 */
export async function autoCompleteParentHierarchy(
  repository: Repository,
  completedObject: TrellisObject,
): Promise<void> {
  // If the completed object has no parent, nothing to do
  if (!completedObject.parent) {
    return;
  }

  // Get the parent object
  const parent = await repository.getObjectById(completedObject.parent);
  if (!parent) {
    return;
  }

  // Check if all children of the parent are done
  const siblings = await Promise.all(
    parent.childrenIds.map((id) => repository.getObjectById(id)),
  );

  // Filter out null results and check if all are done
  const validSiblings = siblings.filter(
    (sibling): sibling is TrellisObject => sibling !== null,
  );
  const allChildrenDone = validSiblings.every(
    (sibling) =>
      sibling.status === TrellisObjectStatus.DONE ||
      sibling.status === TrellisObjectStatus.WONT_DO,
  );

  // If all children are done, mark the parent as done and recurse up the hierarchy
  if (allChildrenDone && parent.status !== TrellisObjectStatus.DONE) {
    parent.status = TrellisObjectStatus.DONE;
    parent.log.push(
      `Auto-completed: All child ${getChildTypeName(parent.type)} are complete`,
    );
    await repository.saveObject(parent);

    // Recursively check the parent's parent
    await autoCompleteParentHierarchy(repository, parent);
  }
}

function getChildTypeName(parentType: TrellisObjectType): string {
  switch (parentType) {
    case TrellisObjectType.PROJECT:
      return "epics";
    case TrellisObjectType.EPIC:
      return "features";
    case TrellisObjectType.FEATURE:
      return "tasks";
    default:
      return "children";
  }
}
