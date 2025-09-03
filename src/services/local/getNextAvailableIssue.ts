import { TrellisObject, TrellisObjectType } from "../../models";
import { Repository } from "../../repositories";
import { filterUnavailableObjects } from "../../utils/filterUnavailableObjects";
import { sortTrellisObjects } from "../../utils/sortTrellisObjects";

/**
 * Finds the next available issue of the specified type(s) within the given scope,
 * ordered by priority (HIGH > MEDIUM > LOW), without claiming or modifying it.
 *
 * @param repository - The repository instance to query
 * @param scope - Optional scope to filter issues (e.g., project/epic ID)
 * @param issueType - Optional issue type(s) to filter by (project, epic, feature, task)
 * @returns Promise resolving to the highest priority available issue
 * @throws Error when no available issues are found matching the criteria
 */
export async function getNextAvailableIssue(
  repository: Repository,
  scope?: string,
  issueType?: TrellisObjectType | TrellisObjectType[],
): Promise<TrellisObject> {
  const objects = await repository.getObjects(
    false, // includeClosed
    scope,
    issueType,
  );

  // Filter to get only available issues
  const availableIssues = await filterUnavailableObjects(objects, repository);

  if (availableIssues.length === 0) {
    throw new Error("No available issues found matching criteria");
  }

  // Sort by priority and return the top one
  const sortedIssues = sortTrellisObjects(availableIssues);
  return sortedIssues[0];
}
