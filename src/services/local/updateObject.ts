import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
} from "../../models";
import { Repository } from "../../repositories";
import { validateStatusTransition } from "../../validation/validateStatusTransition";

export async function updateObject(
  repository: Repository,
  id: string,
  priority?: TrellisObjectPriority,
  prerequisites?: string[],
  body?: string,
  status?: TrellisObjectStatus,
  force: boolean = false,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Load the existing object
    const existingObject = await repository.getObjectById(id);
    if (!existingObject) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Object with ID '${id}' not found`,
          },
        ],
      };
    }

    // Create updated object with new properties, ensuring proper typing
    const updatedObject: TrellisObject = {
      ...existingObject,
      ...(priority && { priority }),
      ...(prerequisites && { prerequisites }),
      ...(body && { body }),
      ...(status && { status }),
    };

    // Validate status transition
    if (status && !force) {
      await validateStatusTransition(updatedObject, repository);
    }

    // Save the updated object
    await repository.saveObject(updatedObject);

    return {
      content: [
        {
          type: "text",
          text: `Successfully updated object: ${JSON.stringify(
            updatedObject,
            null,
            2,
          )}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error updating object: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
