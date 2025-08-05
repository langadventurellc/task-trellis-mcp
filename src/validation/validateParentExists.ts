import type { Repository } from "../repositories/Repository.js";
import { ValidationError } from "./ValidationError.js";
import { ValidationErrorCodes } from "./ValidationErrorCodes.js";

/**
 * Validates that a parent object exists in the repository.
 *
 * @param parentId - The ID of the parent object to validate
 * @param repository - Repository instance to check for parent existence
 * @throws {ValidationError} When parent ID is provided but parent doesn't exist
 */
export async function validateParentExists(
  parentId: string | undefined,
  repository: Repository,
): Promise<void> {
  // If no parent is specified, validation passes
  if (!parentId) {
    return;
  }

  const parentObject = await repository.getObjectById(parentId);

  if (!parentObject) {
    throw new ValidationError(
      `Parent object with ID '${parentId}' does not exist`,
      ValidationErrorCodes.PARENT_NOT_FOUND,
      "parent",
    );
  }
}
