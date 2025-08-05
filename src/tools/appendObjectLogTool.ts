import { Repository } from "../repositories";

export const appendObjectLogTool = {
  name: "append_object_log",
  description: "Appends content to an object's log in the task trellis system",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the object to append log to",
      },
      contents: {
        type: "string",
        description: "Contents to append to the log",
      },
    },
    required: ["id", "contents"],
  },
} as const;

export async function handleAppendObjectLog(
  repository: Repository,
  args: unknown,
) {
  const { id, contents } = args as {
    id: string;
    contents: string;
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

    // Create updated object with new log entry appended
    const updatedObject = {
      ...existingObject,
      log: [...existingObject.log, contents],
    };

    // Save the updated object
    await repository.saveObject(updatedObject);

    return {
      content: [
        {
          type: "text",
          text: `Successfully appended to object log: ${JSON.stringify(
            { id, contents, totalLogEntries: updatedObject.log.length },
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
          text: `Error appending to object log: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
