import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories";

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

    const objectIds = objects.map((obj) => obj.id);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(objectIds, null, 2),
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
