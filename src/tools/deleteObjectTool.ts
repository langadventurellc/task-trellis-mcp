import { Repository } from "../repositories";

export const deleteObjectTool = {
  name: "delete_object",
  description: `Deletes an object from the task trellis system

Use this tool to permanently remove objects from the task hierarchy. Exercise caution as deletion affects related objects and cannot be easily undone.

Safety considerations:
- Standard deletion validates relationships and prevents deletion of objects with dependencies
- Objects with children or that serve as prerequisites for other objects may be protected
- Use 'force=true' to bypass safety checks for administrative cleanup
- Consider updating status to 'cancelled' instead of deletion for audit trail preservation

Deletion impacts:
- Removes object and all associated metadata permanently
- Updates parent-child relationships by removing deleted object from parent's children list
- Other objects referencing this as a prerequisite may become invalid
- Historical references in logs and activity trails are preserved but point to non-existent object

Best practices:
- Verify object has no active dependencies before deletion
- Use list/get tools to understand relationships before deletion
- Prefer status updates to 'cancelled' over deletion for important work items
- Use force deletion only for cleanup of test data or administrative maintenance

This operation is irreversible - ensure you have the correct object ID before proceeding.`,
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
