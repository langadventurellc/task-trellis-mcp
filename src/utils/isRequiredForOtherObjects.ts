import { TrellisObject } from "../models/TrellisObject";
import { TrellisObjectStatus } from "../models/TrellisObjectStatus";
import { Repository } from "../repositories/Repository";

/**
 * Checks if a trellis object is a prerequisite for any other objects that are not closed.
 * An object is considered closed if its status is DONE or WONT_DO.
 *
 * @param trellisObject - The trellis object to check if it's required by others
 * @param repository - The repository to load all objects from
 * @returns Promise<boolean> - true if any non-closed objects have this object as a prerequisite, false otherwise
 */
export async function isRequiredForOtherObjects(
  trellisObject: TrellisObject,
  repository: Repository,
): Promise<boolean> {
  // Load all objects from the repository
  const allObjects = await repository.getObjects(true); // include closed objects to get all

  // Check each object to see if it has this object as a prerequisite and is not closed
  for (const obj of allObjects) {
    // Skip the object itself
    if (obj.id === trellisObject.id) {
      continue;
    }

    // Check if this object has our target object as a prerequisite
    if (obj.prerequisites.includes(trellisObject.id)) {
      // Check if this object is not closed (i.e., not DONE or WONT_DO)
      if (
        obj.status !== TrellisObjectStatus.DONE &&
        obj.status !== TrellisObjectStatus.WONT_DO
      ) {
        return true;
      }
    }
  }

  return false;
}
