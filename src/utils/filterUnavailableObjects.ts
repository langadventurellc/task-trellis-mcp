import { isClaimable } from "../models";
import { TrellisObject } from "../models/TrellisObject";
import { Repository } from "../repositories/Repository";
import { checkHierarchicalPrerequisitesComplete } from "./checkHierarchicalPrerequisitesComplete";

/**
 * Filters a list of TrellisObjects to return only those that are available to work on.
 *
 * An object is considered unavailable if:
 * 1. It doesn't have a claimable status (e.g., "open")
 * 2. It has prerequisites that are incomplete (including hierarchical prerequisites)
 *
 * @param objects - Array of TrellisObjects to filter
 * @param repository - Repository for loading parent objects and checking prerequisites
 * @returns Promise<Array<TrellisObject>> - Array of available TrellisObjects
 */
export async function filterUnavailableObjects(
  objects: TrellisObject[],
  repository: Repository,
): Promise<TrellisObject[]> {
  // Filter objects asynchronously using hierarchical prerequisite checking
  const availableObjects: TrellisObject[] = [];

  for (const obj of objects) {
    // Rule 1: Object must be claimable
    if (!isClaimable(obj)) {
      continue;
    }

    // Rule 2: Check hierarchical prerequisites
    const prereqsComplete = await checkHierarchicalPrerequisitesComplete(
      obj,
      repository,
    );

    if (prereqsComplete) {
      availableObjects.push(obj);
    }
  }

  return availableObjects;
}
