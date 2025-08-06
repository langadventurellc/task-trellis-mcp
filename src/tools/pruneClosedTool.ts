import { Repository } from "../repositories";
import { isClosed } from "../models/isClosed";

export const pruneClosedTool = {
  name: "prune_closed",
  description: "Prunes closed objects from the task trellis system",
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
        console.warn(`Failed to delete object ${obj.id}:`, error);
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
