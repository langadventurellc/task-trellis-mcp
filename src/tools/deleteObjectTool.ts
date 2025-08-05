import { Repository } from "../repositories";

export const deleteObjectTool = {
  name: "delete_object",
  description: "Deletes an object from the task trellis system",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the object to delete",
      },
      force: {
        type: "boolean",
        description: "Force delete flag (defaults to false)",
        default: false,
      },
    },
    required: ["id"],
  },
} as const;

export function handleDeleteObject(repository: Repository, args: unknown) {
  const { id, force = false } = args as {
    id: string;
    force?: boolean;
  };

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Deleted object: ${JSON.stringify({ id, force }, null, 2)}`,
      },
    ],
  };
}
