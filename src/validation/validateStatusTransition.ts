import type { TrellisObject } from "../models/TrellisObject.js";
import { TrellisObjectStatus } from "../models/TrellisObjectStatus.js";
import type { Repository } from "../repositories/Repository.js";
import { checkPrerequisitesComplete } from "../utils/checkPrerequisitesComplete.js";

/**
 * Validates that a status transition is allowed based on prerequisite completion.
 * Only validates transitions to IN_PROGRESS and DONE statuses unless force is true.
 *
 * @param trellisObject - The object with the new status to validate
 * @param repository - Repository for checking prerequisite objects
 * @throws Error if status transition is not allowed due to incomplete prerequisites
 */
export async function validateStatusTransition(
  trellisObject: TrellisObject,
  repository: Repository,
): Promise<void> {
  // Only validate transitions to IN_PROGRESS and DONE
  const requiresPrerequisiteValidation =
    trellisObject.status === TrellisObjectStatus.IN_PROGRESS ||
    trellisObject.status === TrellisObjectStatus.DONE;

  if (!requiresPrerequisiteValidation) {
    return;
  }

  const prerequisitesComplete = await checkPrerequisitesComplete(
    trellisObject,
    repository,
  );

  if (!prerequisitesComplete) {
    const statusName =
      trellisObject.status === TrellisObjectStatus.IN_PROGRESS
        ? "in-progress"
        : "done";

    throw new Error(
      `Cannot update status to '${statusName}' - prerequisites are not complete. Use force=true to override.`,
    );
  }
}
