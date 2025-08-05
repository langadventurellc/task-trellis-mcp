import { TrellisObject } from "../models/TrellisObject";
import { TrellisObjectStatus } from "../models/TrellisObjectStatus";
import { Repository } from "../repositories/Repository";

/**
 * Checks if all prerequisites for a trellis object are complete (closed).
 * A prerequisite is considered complete if its status is DONE or WONT_DO.
 *
 * @param trellisObject - The trellis object to check prerequisites for
 * @param repository - The repository to load prerequisite objects from
 * @returns Promise<boolean> - true if all prerequisites are complete or no prerequisites exist, false otherwise
 */
export async function checkPrerequisitesComplete(
  trellisObject: TrellisObject,
  repository: Repository,
): Promise<boolean> {
  // If no prerequisites, return true
  if (
    !trellisObject.prerequisites ||
    trellisObject.prerequisites.length === 0
  ) {
    return true;
  }

  // Use bulk getObjects call for better performance
  const allObjects = await repository.getObjects();
  const objectMap = new Map<string, TrellisObject>();
  allObjects.forEach((obj) => objectMap.set(obj.id, obj));

  // Check if any prerequisite that exists in our system is not complete
  for (const prerequisiteId of trellisObject.prerequisites) {
    const prerequisiteObj = objectMap.get(prerequisiteId);

    // If prerequisite is not in our system, it's fine (external dependency)
    if (!prerequisiteObj) {
      continue;
    }

    // If prerequisite is in our system but not done or wont-do, it's blocking
    if (
      prerequisiteObj.status !== TrellisObjectStatus.DONE &&
      prerequisiteObj.status !== TrellisObjectStatus.WONT_DO
    ) {
      return false;
    }
  }

  return true;
}
