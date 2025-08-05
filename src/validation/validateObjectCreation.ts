import type { TrellisObject } from "../models/TrellisObject.js";
import type { Repository } from "../repositories/Repository.js";
import { validateParentExists } from "./validateParentExists.js";

/**
 * Validates a TrellisObject before creation.
 * Orchestrates all validation rules for object creation.
 *
 * @param trellisObject - The object to validate
 * @param repository - Repository instance for data access during validation
 * @throws {ValidationError} When any validation rule fails
 */
export async function validateObjectCreation(
  trellisObject: TrellisObject,
  repository: Repository,
): Promise<void> {
  // Validate parent existence
  await validateParentExists(trellisObject.parent, repository);

  // Future validation rules can be added here
  // e.g., validatePrerequisites, validateObjectType, etc.
}
