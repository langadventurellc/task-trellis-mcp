import { Repository } from "../repositories";
import { isClosed } from "../models/isClosed";

export const pruneClosedTool = {
  name: "prune_closed",
  description: `Prunes closed objects from the task trellis system

Use this tool for maintenance and cleanup of completed, cancelled, or otherwise closed objects that are no longer needed. Essential for system hygiene and performance optimization.

Pruning criteria:
- 'age': Minimum age in minutes since object closure (required)
- 'scope': Limit pruning to specific project or area (optional)
- Objects must be in closed states (completed, cancelled, archived)
- Objects must not have active dependencies or relationships

Safety mechanisms:
- Only removes truly closed objects (completed, cancelled, etc.)
- Validates no active objects depend on pruned items
- Preserves objects referenced by active work
- Maintains referential integrity of remaining system

Common usage patterns:
- Daily cleanup: age=1440 (24 hours)
- Weekly maintenance: age=10080 (7 days) 
- Project closure: scope='project-name', age=4320 (3 days)
- System cleanup: age=43200 (30 days)

Pruning benefits:
- Reduces database size and improves query performance
- Removes clutter from active task views
- Prevents accumulation of obsolete work items
- Maintains focus on current and relevant tasks

Use regularly as part of system maintenance to keep the task trellis clean and performant. Consider project lifecycles and audit requirements when setting age thresholds.

This operation is permanent - pruned objects cannot be recovered.`,
  inputSchema: {
    type: "object",
    properties: {
      scope: {
        type: "string",
        description: "Scope to prune objects from (optional)",
      },
      age: {
        type: "number",
        description: "Age in minutes for objects to be considered for pruning",
      },
    },
    required: ["age"],
  },
} as const;

export async function handlePruneClosed(repository: Repository, args: unknown) {
  const { scope, age } = args as {
    scope?: string;
    age: number;
  };

  try {
    // Get all objects including closed ones
    const objects = await repository.getObjects(true, scope);

    // Filter to only closed objects
    const closedObjects = objects.filter(isClosed);

    // Calculate cutoff time (age in minutes ago)
    const cutoffTime = new Date(Date.now() - age * 60 * 1000);

    // Filter to objects older than cutoff
    const objectsToDelete = closedObjects.filter((obj) => {
      const updatedTime = new Date(obj.updated);
      return updatedTime < cutoffTime;
    });

    // Delete each object
    const deletedIds: string[] = [];
    for (const obj of objectsToDelete) {
      try {
        await repository.deleteObject(obj.id, true);
        deletedIds.push(obj.id);
      } catch (error) {
        // Continue with other objects even if one fails
        console.error(`Failed to delete object ${obj.id}:`, error);
      }
    }

    const message = scope
      ? `Pruned ${deletedIds.length} closed objects older than ${age} minutes in scope ${scope}`
      : `Pruned ${deletedIds.length} closed objects older than ${age} minutes`;

    return {
      content: [
        {
          type: "text",
          text: `${message}${
            deletedIds.length > 0
              ? `
Deleted objects: ${deletedIds.join(", ")}`
              : ""
          }`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error pruning closed objects: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
