import { Repository } from "../repositories";
import { TrellisObject } from "../models/TrellisObject";
import { TrellisObjectType } from "../models/TrellisObjectType";
import { TrellisObjectStatus } from "../models/TrellisObjectStatus";
import { filterUnavailableObjects } from "../utils/filterUnavailableObjects";
import { sortTrellisObjects } from "../utils/sortTrellisObjects";
import { checkPrerequisitesComplete } from "../utils/checkPrerequisitesComplete";

export const claimTaskTool = {
  name: "claim_task",
  description: "Claims a task in the task trellis system",
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
      // Branch 1: task_id is specified
      const object = await repository.getObjectById(taskId);

      if (!object) {
        throw new Error(`Task with ID "${taskId}" not found`);
      }

      // Validate it's a task
      if (object.type !== TrellisObjectType.TASK) {
        throw new Error(
          `Object with ID "${taskId}" is not a task (type: ${object.type})`,
        );
      }

      if (!force) {
        // Validate status is draft or open
        if (
          object.status !== TrellisObjectStatus.DRAFT &&
          object.status !== TrellisObjectStatus.OPEN
        ) {
          throw new Error(
            `Task "${taskId}" cannot be claimed (status: ${object.status}). Task must be in draft or open status.`,
          );
        }

        // Validate all prerequisites are complete
        const prerequisitesComplete = await checkPrerequisitesComplete(
          object,
          repository,
        );
        if (!prerequisitesComplete) {
          throw new Error(
            `Task "${taskId}" cannot be claimed. Not all prerequisites are complete.`,
          );
        }
      }

      claimedTask = object;
    } else {
      // Branch 2: task_id is not specified - find highest priority available task
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
      claimedTask = sortedTasks[0];
    }

    // Update task status to in-progress and save
    const updatedTask = {
      ...claimedTask,
      status: TrellisObjectStatus.IN_PROGRESS,
    };

    await repository.saveObject(updatedTask);

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
