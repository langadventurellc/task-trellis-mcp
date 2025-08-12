import { isClaimable } from "../models";
import { TrellisObject } from "../models/TrellisObject";
import { TrellisObjectStatus } from "../models/TrellisObjectStatus";
import { TrellisObjectType } from "../models/TrellisObjectType";
import { Repository } from "../repositories";
import { checkPrerequisitesComplete } from "../utils/checkPrerequisitesComplete";
import { filterUnavailableObjects } from "../utils/filterUnavailableObjects";
import { sortTrellisObjects } from "../utils/sortTrellisObjects";

export const claimTaskTool = {
  name: "claim_task",
  description: `Claims a task in the task trellis system

Use this tool to assign yourself to available tasks for execution. Essential for AI agents to pick up work items from the task queue and begin execution.

Claiming behavior:
- Without 'taskId': Claims the next available task based on priority and readiness
- With 'taskId': Claims a specific task by ID if available and ready
- 'scope': Limits claiming to tasks within a specific project or area
- 'force': Overrides normal claiming restrictions (use with caution)

Task readiness criteria:
- Task status allows claiming (typically 'draft' or 'open' states)
- All prerequisites are satisfied (prerequisite tasks completed)
- Task is not already claimed by another agent
- Task falls within specified scope if provided

Claiming workflow:
1. System evaluates available tasks against readiness criteria
2. Selects highest priority task that meets requirements
3. Updates task status to 'in-progress
4. Associates task with the claiming agent
5. Returns claimed task details for execution

Common patterns:
- Claim any ready task: (no parameters)
- Claim from project: scope='P-project-name'
- Claim specific task: taskId='T-specific-task-id'
- Force claim blocked task: taskId='T-task-id', force=true

Essential for autonomous task execution workflows where agents need to discover and claim work items dynamically.`,
  inputSchema: {
    type: "object",
    properties: {
      scope: {
        type: "string",
        description: "Scope to claim task from (optional)",
      },
      taskId: {
        type: "string",
        description: "Specific task ID to claim (optional)",
      },
      force: {
        type: "boolean",
        description: "Force claim flag (defaults to false)",
        default: false,
      },
    },
  },
} as const;

export async function handleClaimTask(repository: Repository, args: unknown) {
  const {
    scope,
    taskId,
    force = false,
  } = args as {
    scope?: string;
    taskId?: string;
    force?: boolean;
  };

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
