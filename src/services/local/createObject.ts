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
  parent: string | null = null,
  priority: TrellisObjectPriority = TrellisObjectPriority.MEDIUM,
  status: TrellisObjectStatus = TrellisObjectStatus.OPEN,
  prerequisites: string[] = [],
  description: string = "",
  externalIssueId?: string,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Get existing objects to generate unique ID
  const existingObjects = await repository.getObjects(true);
  const existingIds = existingObjects.map((obj) => obj.id);

  // Generate unique ID
  const id = generateUniqueId(title, type, existingIds);

  const droppedExternalIssueId = parent != null && !!externalIssueId;
  const shouldStoreExternalIssueId = parent == null && !!externalIssueId;

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
    ...(shouldStoreExternalIssueId ? { externalIssueId } : {}),
  };

  // Validate object before saving
  await validateObjectCreation(trellisObject, repository);

  // Save through repository
  await repository.saveObject(trellisObject);

  const content: Array<{ type: string; text: string }> = [
    { type: "text", text: `Created object with ID: ${id}` },
  ];

  if (droppedExternalIssueId) {
    content.push({
      type: "text",
      text: "Warning: externalIssueId ignored (only allowed on top-level issues)",
    });
  }

  return { content };
}
