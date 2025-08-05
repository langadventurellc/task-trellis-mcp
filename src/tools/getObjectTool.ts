import { Repository } from "../repositories/Repository";

export const getObjectTool = {
  name: "get_object",
  description: "Gets an object from the task trellis system",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the object to retrieve",
      },
    },
    required: ["id"],
  },
} as const;

export async function handleGetObject(repository: Repository, args: unknown) {
  const { id } = args as {
    id: string;
  };

  try {
    const object = await repository.getObjectById(id);

    if (!object) {
      return {
        content: [
          {
            type: "text",
            text: `Object with ID "${id}" not found`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Retrieved object: ${JSON.stringify(object, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error retrieving object with ID "${id}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
