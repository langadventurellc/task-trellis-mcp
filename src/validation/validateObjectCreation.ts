import type { TrellisObject } from "../models/TrellisObject.js";
import type { Repository } from "../repositories/Repository.js";
import { inferObjectType } from "../utils/inferObjectType.js";
import { validateParentExists } from "./validateParentExists.js";
import { validateParentType } from "./validateParentType.js";

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
  // Validate parent type compatibility
  const objectType = inferObjectType(trellisObject.id);
  validateParentType(objectType, trellisObject.parent);

  // Validate parent existence
  await validateParentExists(trellisObject.parent, repository);

  // Future validation rules can be added here
  // e.g., validatePrerequisites, validateObjectType, etc.
}
