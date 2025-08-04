import { TrellisObject } from "../models/TrellisObject";
import { TrellisObjectStatus } from "../models/TrellisObjectStatus";

/**
 * Filters a list of TrellisObjects to return only those that are available to work on.
 *
 * An object is considered unavailable if:
 * 1. It doesn't have a status of "open"
 * 2. It has prerequisites that refer to objects in the same list that are not "done" or "wont-do"
 *
 * @param objects - Array of TrellisObjects to filter
 * @returns Array of available TrellisObjects
 */
export function filterUnavailableObjects(
  objects: TrellisObject[],
): TrellisObject[] {
  // Create a map for quick lookup of objects by ID
  const objectMap = new Map<string, TrellisObject>();
  objects.forEach((obj) => objectMap.set(obj.id, obj));

  return objects.filter((obj) => {
    // Rule 1: Object must have status "open"
    if (obj.status !== TrellisObjectStatus.OPEN) {
      return false;
    }

    // Rule 2: Check prerequisites
    for (const prerequisiteId of obj.prerequisites) {
      const prerequisiteObj = objectMap.get(prerequisiteId);

      // If prerequisite is not in the list, it's fine (external dependency)
      if (!prerequisiteObj) {
        continue;
      }

      // If prerequisite is in the list but not done or wont-do, exclude this object
      if (
        prerequisiteObj.status !== TrellisObjectStatus.DONE &&
        prerequisiteObj.status !== TrellisObjectStatus.WONT_DO
      ) {
        return false;
      }
    }

    return true;
  });
}
