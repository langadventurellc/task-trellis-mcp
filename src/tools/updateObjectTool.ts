import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
} from "../models";
import { Repository } from "../repositories";
import { validateStatusTransition } from "../validation/validateStatusTransition";

export const updateObjectTool = {
  name: "update_object",
  description: `Updates an existing object in the task trellis system

Use this tool to modify properties of existing objects such as changing status, priority, prerequisites, or content. Essential for managing work item lifecycle and maintaining project state.

Available status values:
- 'draft': Initial state for new objects
- 'open': Ready to begin work (default for new objects)
- 'in-progress': Currently being worked on
- 'done': Completed successfully
- 'wont-do': Cancelled or decided against

Available priority values:
- 'high': Critical or urgent work
- 'medium': Standard priority
- 'low': Nice-to-have or future work

Updatable properties:
- 'status': Progress state (follows workflow: draft → open → in-progress → done)
- 'priority': Importance level (high, medium, low)
- 'prerequisites': Dependency relationships (add/remove prerequisite objects)
- 'body': Detailed description or content of the work item
- 'force': Bypass certain validation checks when necessary

Common update patterns:
- Mark task as ready: status='open'
- Start working: status='in-progress'
- Change priority: priority='high'
- Add dependencies: prerequisites=[...existing, 'new-prereq-id']
- Update description: body='detailed work description'
- Complete work: status='done'
- Cancel work: status='wont-do'

The update maintains object integrity by validating relationships and preserving audit trail. Use 'force=true' only when bypassing standard validation is necessary for administrative operations.

Updates automatically refresh the 'updated' timestamp while preserving creation metadata and change history.`,
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the object to update",
      },
      priority: {
        type: "string",
        description: "Priority level (optional)",
      },
      prerequisites: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of prerequisite object IDs (optional)",
      },
      body: {
        type: "string",
        description: "Body content of the object (optional)",
      },
      status: {
        type: "string",
        description: "Status of the object (optional)",
      },
      force: {
        type: "boolean",
        description: "Force update flag (defaults to false)",
        default: false,
      },
    },
    required: ["id"],
  },
} as const;

export async function handleUpdateObject(
  repository: Repository,
  args: unknown,
) {
  const {
    id,
    priority,
    prerequisites,
    body,
    status,
    force = false,
  } = args as {
    id: string;
    priority?: string;
    prerequisites?: string[];
    body?: string;
    status?: string;
    force?: boolean;
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

    // Create updated object with new properties, ensuring proper typing
    const updatedObject: TrellisObject = {
      ...existingObject,
      ...(priority && { priority: priority as TrellisObjectPriority }),
      ...(prerequisites && { prerequisites }),
      ...(body && { body }),
      ...(status && { status: status as TrellisObjectStatus }),
    };

    // Validate status transition
    if (status && !force) {
      await validateStatusTransition(updatedObject, repository);
    }

    // Save the updated object
    await repository.saveObject(updatedObject);

    return {
      content: [
        {
          type: "text",
          text: `Successfully updated object: ${JSON.stringify(
            updatedObject,
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
          text: `Error updating object: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
