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

const normalizeEnumInput = <T>(input: T | T[] | undefined): T[] | undefined => {
  if (input === undefined) return undefined;
  return Array.isArray(input) ? input : [input];
};

export async function listObjects(
  repository: Repository,
  type?: TrellisObjectType | TrellisObjectType[],
  scope?: string,
  status?: TrellisObjectStatus | TrellisObjectStatus[],
  priority?: TrellisObjectPriority | TrellisObjectPriority[],
  includeClosed: boolean = false,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Normalize inputs to arrays
    const normalizedType = normalizeEnumInput(type);
    const normalizedStatus = normalizeEnumInput(status);
    const normalizedPriority = normalizeEnumInput(priority);

    // Get objects from repository
    const objects = await repository.getObjects(
      includeClosed,
      scope,
      normalizedType,
      normalizedStatus,
      normalizedPriority,
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
