import { TrellisObjectType } from "../models/TrellisObjectType.js";
import { inferObjectType } from "../utils/inferObjectType.js";

/**
 * Validates that the parent type is appropriate for the object type being created.
 *
 * Business rules:
 * - Projects cannot have parents
 * - Epics must have a project as a parent
 * - Features can either have an epic as a parent or have no parent
 * - Tasks can have a feature as a parent or have no parent
 *
 * @param objectType - The type of object being created
 * @param parentId - The parent ID (can be null/undefined for objects without parents)
 * @throws {Error} When parent type is invalid for the object type
 */
export function validateParentType(
  objectType: TrellisObjectType,
  parentId: string | null | undefined,
): void {
  if (!parentId) {
    // No parent - only allowed for projects, features, and tasks
    if (objectType === TrellisObjectType.EPIC) {
      throw new Error("Epics must have a project as a parent");
    }
    return;
  }

  const parentType = inferObjectType(parentId);

  switch (objectType) {
    case TrellisObjectType.PROJECT:
      throw new Error("Projects cannot have parents");

    case TrellisObjectType.EPIC:
      if (parentType !== TrellisObjectType.PROJECT) {
        throw new Error("Epics must have a project as a parent");
      }
      break;

    case TrellisObjectType.FEATURE:
      if (parentType !== TrellisObjectType.EPIC) {
        throw new Error("Features can only have an epic as a parent");
      }
      break;

    case TrellisObjectType.TASK:
      if (parentType !== TrellisObjectType.FEATURE) {
        throw new Error("Tasks can only have a feature as a parent");
      }
      break;
  }
}
