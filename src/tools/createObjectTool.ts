export const createObjectTool = {
  name: "create_object",
  description: "Creates a new object in the task trellis system",
  inputSchema: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        description: "Type of object to create",
      },
      title: {
        type: "string",
        description: "Title of the object",
      },
      parent: {
        type: "string",
        description: "Parent object ID (optional)",
      },
      priority: {
        type: "string",
        description: "Priority level (defaults to 'medium')",
        default: "medium",
      },
      status: {
        type: "string",
        description: "Status of the object (defaults to 'draft')",
        default: "draft",
      },
      prerequisites: {
        type: "array",
        items: {
          type: "string",
        },
        description:
          "Array of prerequisite object IDs (defaults to empty array)",
        default: [],
      },
      description: {
        type: "string",
        description: "Description of the object",
      },
    },
    required: ["kind", "title"],
  },
} as const;

export function handleCreateObject(args: unknown) {
  const {
    kind,
    title,
    parent,
    priority = "medium",
    status = "draft",
    prerequisites = [],
    description,
  } = args as {
    kind: string;
    title: string;
    parent?: string;
    priority?: string;
    status?: string;
    prerequisites?: string[];
    description?: string;
  };

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Created object: ${JSON.stringify(
          {
            kind,
            title,
            parent,
            priority,
            status,
            prerequisites,
            description,
          },
          null,
          2,
        )}`,
      },
    ],
  };
}
