import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
} from "../models";
import { Repository } from "../repositories";
import { validateStatusTransition } from "../validation/validateStatusTransition";

export const updateObjectTool = {
  name: "update_object",
  description: "Updates an existing object in the task trellis system",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the object to update",
      },
      priority: {
        type: "string",
        description: "Priority level (optional)",
      },
      prerequisites: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of prerequisite object IDs (optional)",
      },
      body: {
        type: "string",
        description: "Body content of the object (optional)",
      },
      status: {
        type: "string",
        description: "Status of the object (optional)",
      },
      force: {
        type: "boolean",
        description: "Force update flag (defaults to false)",
        default: false,
      },
    },
    required: ["id"],
  },
} as const;

export async function handleUpdateObject(
  repository: Repository,
  args: unknown,
) {
  const {
    id,
    priority,
    prerequisites,
    body,
    status,
    force = false,
  } = args as {
    id: string;
    priority?: string;
    prerequisites?: string[];
    body?: string;
    status?: string;
    force?: boolean;
  };

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
      ...(priority && { priority: priority as TrellisObjectPriority }),
      ...(prerequisites && { prerequisites }),
      ...(body && { body }),
      ...(status && { status: status as TrellisObjectStatus }),
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
