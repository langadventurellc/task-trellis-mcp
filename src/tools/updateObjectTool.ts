import { Repository } from "../repositories";

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

export function handleUpdateObject(repository: Repository, args: unknown) {
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

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Updated object: ${JSON.stringify(
          {
            id,
            priority,
            prerequisites,
            body,
            status,
            force,
          },
          null,
          2,
        )}`,
      },
    ],
  };
}
