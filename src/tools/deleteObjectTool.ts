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

export async function handleDeleteObject(
  repository: Repository,
  args: unknown,
) {
  const { id, force = false } = args as {
    id: string;
    force?: boolean;
  };

  try {
    await repository.deleteObject(id, force);

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted object: ${id}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error deleting object with ID "${id}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
