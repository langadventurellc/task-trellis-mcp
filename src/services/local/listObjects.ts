import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectSummary,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories";

function convertToSummary(obj: TrellisObject): TrellisObjectSummary {
  return {
    id: obj.id,
    type: obj.type,
    title: obj.title,
    status: obj.status,
    priority: obj.priority,
    parent: obj.parent,
    prerequisites: obj.prerequisites,
    childrenIds: obj.childrenIds,
    created: obj.created,
    updated: obj.updated,
  };
}

export async function listObjects(
  repository: Repository,
  type: TrellisObjectType,
  scope?: string,
  status?: TrellisObjectStatus,
  priority?: TrellisObjectPriority,
  includeClosed: boolean = false,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Get objects from repository
    const objects = await repository.getObjects(
      includeClosed,
      scope,
      type,
      status,
      priority,
    );

    const objectSummaries = objects.map(convertToSummary);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(objectSummaries, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error listing objects: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
