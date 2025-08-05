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

  // Load all prerequisite objects
  const prerequisiteLoadPromises = trellisObject.prerequisites.map((id) =>
    repository.getObjectById(id),
  );

  const prerequisiteObjects = await Promise.all(prerequisiteLoadPromises);

  // Check if any prerequisite is missing or not closed
  for (let i = 0; i < prerequisiteObjects.length; i++) {
    const prerequisite = prerequisiteObjects[i];

    // If prerequisite doesn't exist, return false
    if (!prerequisite) {
      return false;
    }

    // If prerequisite is not in a closed state (DONE or WONT_DO), return false
    if (
      prerequisite.status !== TrellisObjectStatus.DONE &&
      prerequisite.status !== TrellisObjectStatus.WONT_DO
    ) {
      return false;
    }
  }

  return true;
}
