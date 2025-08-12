import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories";
import { generateUniqueId } from "../../utils";
import { validateObjectCreation } from "../../validation/validateObjectCreation";

export async function createObject(
  repository: Repository,
  type: TrellisObjectType,
  title: string,
  parent?: string,
  priority: TrellisObjectPriority = TrellisObjectPriority.MEDIUM,
  status: TrellisObjectStatus = TrellisObjectStatus.OPEN,
  prerequisites: string[] = [],
  description: string = "",
): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Get existing objects to generate unique ID
  const existingObjects = await repository.getObjects(true);
  const existingIds = existingObjects.map((obj) => obj.id);

  // Generate unique ID
  const id = generateUniqueId(title, type, existingIds);

  // Create TrellisObject with current timestamp
  const now = new Date().toISOString();
  const trellisObject: TrellisObject = {
    id,
    type,
    title,
    status,
    priority,
    parent,
    prerequisites,
    affectedFiles: new Map(),
    log: [],
    schema: "v1.0",
    childrenIds: [],
    created: now,
    updated: now,
    body: description,
  };

  // Validate object before saving
  await validateObjectCreation(trellisObject, repository);

  // Save through repository
  await repository.saveObject(trellisObject);

  return {
    content: [
      {
        type: "text",
        text: `Created object with ID: ${id}`,
      },
    ],
  };
}
