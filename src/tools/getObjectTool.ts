import { Repository } from "../repositories";

export const getObjectTool = {
  name: "get_issue",
  description: `Gets an issue from the task trellis system

Use this tool to retrieve detailed information about a specific issue by its unique ID. Returns the complete issue data including metadata, relationships, content, and activity history.

Key information retrieved:
- Issue metadata (type, title, status, priority, timestamps)
- Hierarchical relationships (parent, children, prerequisites)
- Content body and description
- Activity log and change history
- File associations and modifications
- Current state and progress indicators

Usage scenarios:
- Review task details before starting work
- Check issue status and dependencies
- Examine change history and activity logs
- Understand parent-child relationships
- Verify prerequisite completion
- Access associated file changes

Essential for understanding the full context of a work item before making modifications or planning next steps.`,
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the issue to retrieve",
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

    // Convert Map objects to plain objects for proper JSON serialization
    const serializedObject = {
      ...object,
      affectedFiles: Object.fromEntries(object.affectedFiles),
    };

    return {
      content: [
        {
          type: "text",
          text: `Retrieved object: ${JSON.stringify(serializedObject, null, 2)}`,
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
