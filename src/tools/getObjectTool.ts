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

export function handleGetObject(args: unknown) {
  const { id } = args as {
    id: string;
  };

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Retrieved object: ${JSON.stringify({ id }, null, 2)}`,
      },
    ],
  };
}
