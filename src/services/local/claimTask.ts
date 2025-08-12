import {
  isClaimable,
  TrellisObject,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories";
import { checkPrerequisitesComplete } from "../../utils/checkPrerequisitesComplete";
import { filterUnavailableObjects } from "../../utils/filterUnavailableObjects";
import { sortTrellisObjects } from "../../utils/sortTrellisObjects";

export async function claimTask(
  repository: Repository,
  scope?: string,
  taskId?: string,
  force: boolean = false,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    let claimedTask: TrellisObject;

    if (taskId) {
      claimedTask = await claimSpecificTask(taskId, force, repository);
    } else {
      claimedTask = await findNextAvailableTask(scope, repository);
    }

    const updatedTask = await updateTaskStatus(claimedTask, repository);

    return {
      content: [
        {
          type: "text",
          text: `Successfully claimed task: ${JSON.stringify(updatedTask, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error claiming task: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

async function claimSpecificTask(
  taskId: string,
  force: boolean,
  repository: Repository,
): Promise<TrellisObject> {
  const object = await repository.getObjectById(taskId);

  if (!object) {
    throw new Error(`Task with ID "${taskId}" not found`);
  }

  await validateTaskForClaiming(object, taskId, force, repository);
  return object;
}

async function findNextAvailableTask(
  scope: string | undefined,
  repository: Repository,
): Promise<TrellisObject> {
  const objects = await repository.getObjects(
    false, // includeClosed
    scope,
    TrellisObjectType.TASK,
  );

  // Filter to get only available tasks
  const availableTasks = filterUnavailableObjects(objects);

  if (availableTasks.length === 0) {
    throw new Error("No available tasks to claim");
  }

  // Sort by priority and return the top one
  const sortedTasks = sortTrellisObjects(availableTasks);
  return sortedTasks[0];
}

async function updateTaskStatus(
  task: TrellisObject,
  repository: Repository,
): Promise<TrellisObject> {
  const updatedTask = {
    ...task,
    status: TrellisObjectStatus.IN_PROGRESS,
  };

  await repository.saveObject(updatedTask);

  // Update parent hierarchy to in-progress (don't let errors fail the task claim)
  try {
    await updateParentHierarchy(task.parent, repository);
  } catch (error) {
    // Log but don't propagate parent hierarchy update errors
    console.warn("Failed to update parent hierarchy:", error);
  }

  return updatedTask;
}

async function validateTaskForClaiming(
  task: TrellisObject,
  taskId: string,
  force: boolean,
  repository: Repository,
): Promise<void> {
  // Validate it's a task
  if (task.type !== TrellisObjectType.TASK) {
    throw new Error(
      `Object with ID "${taskId}" is not a task (type: ${task.type})`,
    );
  }

  if (!force) {
    // Validate status is draft or open
    if (!isClaimable(task)) {
      throw new Error(
        `Task "${taskId}" cannot be claimed (status: ${task.status}). Task must be in draft or open status.`,
      );
    }

    // Validate all prerequisites are complete
    const prerequisitesComplete = await checkPrerequisitesComplete(
      task,
      repository,
    );
    if (!prerequisitesComplete) {
      throw new Error(
        `Task "${taskId}" cannot be claimed. Not all prerequisites are complete.`,
      );
    }
  }
}

async function updateParentHierarchy(
  parentId: string | undefined,
  repository: Repository,
  visitedIds: Set<string> = new Set(),
): Promise<void> {
  if (!parentId) {
    return;
  }

  // Prevent infinite recursion by checking if we've already visited this ID
  if (visitedIds.has(parentId)) {
    return;
  }
  visitedIds.add(parentId);

  const parent = await repository.getObjectById(parentId);
  if (!parent) {
    return;
  }

  // If parent is already in progress, we can stop here since we assume
  // its parent is already in progress too
  if (parent.status === TrellisObjectStatus.IN_PROGRESS) {
    return;
  }

  // Update parent to in-progress
  const updatedParent = {
    ...parent,
    status: TrellisObjectStatus.IN_PROGRESS,
  };

  await repository.saveObject(updatedParent);

  // Continue up the hierarchy
  await updateParentHierarchy(parent.parent, repository, visitedIds);
}
