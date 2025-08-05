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

export function handleAppendObjectLog(args: unknown) {
  const { id, contents } = args as {
    id: string;
    contents: string;
  };

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Appended to object log: ${JSON.stringify(
          { id, contents },
          null,
          2,
        )}`,
      },
    ],
  };
}
