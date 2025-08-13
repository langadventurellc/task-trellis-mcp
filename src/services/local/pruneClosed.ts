import { isClosed } from "../../models";
import { Repository } from "../../repositories";

export async function pruneClosed(
  repository: Repository,
  age: number,
  scope?: string,
): Promise<{ content: Array<{ type: string; text: string }> }> {
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
              ? `\nDeleted objects: ${deletedIds.join(", ")}`
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
