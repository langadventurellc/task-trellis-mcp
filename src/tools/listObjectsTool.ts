import { Repository } from "../repositories";

export const listObjectsTool = {
  name: "list_objects",
  description: "Lists objects from the task trellis system",
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type of objects to list",
      },
      scope: {
        type: "string",
        description: "Scope to filter objects (optional)",
      },
      status: {
        type: "string",
        description: "Status to filter objects (optional)",
      },
      priority: {
        type: "string",
        description: "Priority to filter objects (optional)",
      },
      includeClosed: {
        type: "boolean",
        description: "Include closed objects (defaults to false)",
        default: false,
      },
    },
    required: ["type"],
  },
} as const;

export function handleListObjects(repository: Repository, args: unknown) {
  const {
    type,
    scope,
    status,
    priority,
    includeClosed = false,
  } = args as {
    type: string;
    scope?: string;
    status?: string;
    priority?: string;
    includeClosed?: boolean;
  };

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Listed objects: ${JSON.stringify(
          {
            type,
            scope,
            status,
            priority,
            includeClosed,
          },
          null,
          2,
        )}`,
      },
    ],
  };
}
