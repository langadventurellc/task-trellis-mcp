import { isClosed, isOpen } from "../../models";
import { Repository } from "../../repositories";

/**
 * Recursively checks if an object has any open descendants at any level.
 *
 * @param objectId - The ID of the object to check for open descendants
 * @param repository - The repository to query for children
 * @param visited - Set to track visited objects and prevent infinite loops
 * @returns Promise<boolean> - true if any descendant at any level is open
 */
async function hasOpenDescendants(
  objectId: string,
  repository: Repository,
  visited: Set<string> = new Set(),
): Promise<boolean> {
  // Prevent infinite loops by tracking visited objects
  if (visited.has(objectId)) {
    return false;
  }
  visited.add(objectId);

  try {
    // Get all children (including closed ones)
    const children = await repository.getChildrenOf(objectId, true);

    // Check each child
    for (const child of children) {
      // If any direct child is open, return true immediately
      if (isOpen(child)) {
        return true;
      }

      // Recursively check if this child has open descendants
      if (await hasOpenDescendants(child.id, repository, visited)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    // If we can't check descendants, err on the side of caution
    console.error(`Error checking descendants for ${objectId}:`, error);
    return false;
  }
}

export async function pruneClosed(
  repository: Repository,
  age: number,
  scope?: string,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Early return for disabled auto-prune
    if (age <= 0) {
      const message = scope
        ? `Auto-prune disabled (threshold: ${age} days) in scope ${scope}`
        : `Auto-prune disabled (threshold: ${age} days)`;

      return {
        content: [{ type: "text", text: message }],
      };
    }

    // Get all objects including closed ones
    const objects = await repository.getObjects(true, scope);

    // Filter to only closed objects
    const closedObjects = objects.filter(isClosed);

    // Calculate cutoff time (age in days ago)
    const cutoffTime = new Date(Date.now() - age * 24 * 60 * 60 * 1000);

    // Filter to objects older than cutoff
    const objectsToDelete = closedObjects.filter((obj) => {
      const updatedTime = new Date(obj.updated);
      return updatedTime < cutoffTime;
    });

    // Delete each object with hierarchical child validation
    const deletedIds: string[] = [];
    const skippedIds: string[] = [];

    for (const obj of objectsToDelete) {
      try {
        // Check if object has open descendants at any level
        const hasOpenDescendantsResult = await hasOpenDescendants(
          obj.id,
          repository,
        );

        if (hasOpenDescendantsResult) {
          // Skip deletion if object has open descendants
          skippedIds.push(obj.id);
          continue;
        }

        // Proceed with deletion if no open children
        await repository.deleteObject(obj.id, true);
        deletedIds.push(obj.id);
      } catch (error) {
        // Continue with other objects even if one fails
        console.error(`Failed to delete object ${obj.id}:`, error);
      }
    }

    const message = scope
      ? `Pruned ${deletedIds.length} closed objects older than ${age} days in scope ${scope}`
      : `Pruned ${deletedIds.length} closed objects older than ${age} days`;

    const skippedMessage =
      skippedIds.length > 0
        ? `\nSkipped ${skippedIds.length} objects with open children: ${skippedIds.join(", ")}`
        : "";

    return {
      content: [
        {
          type: "text",
          text: `${message}${
            deletedIds.length > 0
              ? `\nDeleted objects: ${deletedIds.join(", ")}`
              : ""
          }${skippedMessage}`,
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
