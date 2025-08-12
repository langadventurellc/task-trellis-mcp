import { ServerConfig } from "../../configuration";
import {
  TrellisObject,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories";
import { appendAffectedFiles } from "./appendAffectedFiles.js";

export async function completeTask(
  repository: Repository,
  taskId: string,
  summary: string,
  filesChanged: Record<string, string>,
  serverConfig?: ServerConfig,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Get the task object from repository
  const task = await repository.getObjectById(taskId);
  if (!task) {
    throw new Error(`Task with ID "${taskId}" not found`);
  }

  // Check if task is in progress
  if (task.status !== TrellisObjectStatus.IN_PROGRESS) {
    throw new Error(
      `Task "${taskId}" is not in progress (current status: ${task.status})`,
    );
  }

  // Update task status to done
  task.status = TrellisObjectStatus.DONE;

  // Append to affected files map
  appendAffectedFiles(task, filesChanged);

  // Append summary to log
  task.log.push(summary);

  // Save the updated task
  await repository.saveObject(task);

  // If auto-complete parent is enabled, check if we should complete parent objects
  if (serverConfig?.autoCompleteParent) {
    await autoCompleteParentHierarchy(repository, task);
  }

  return {
    content: [
      {
        type: "text",
        text: `Task "${taskId}" completed successfully. Updated ${Object.keys(filesChanged).length} affected files.`,
      },
    ],
  };
}

async function autoCompleteParentHierarchy(
  repository: Repository,
  completedObject: TrellisObject,
) {
  // If the completed object has no parent, nothing to do
  if (!completedObject.parent) {
    return;
  }

  // Get the parent object
  const parent = await repository.getObjectById(completedObject.parent);
  if (!parent) {
    return;
  }

  // Check if all children of the parent are done
  const siblings = await Promise.all(
    parent.childrenIds.map((id) => repository.getObjectById(id)),
  );

  // Filter out null results and check if all are done
  const validSiblings = siblings.filter(
    (sibling): sibling is TrellisObject => sibling !== null,
  );
  const allChildrenDone = validSiblings.every(
    (sibling) =>
      sibling.status === TrellisObjectStatus.DONE ||
      sibling.status === TrellisObjectStatus.WONT_DO,
  );

  // If all children are done, mark the parent as done and recurse up the hierarchy
  if (allChildrenDone && parent.status !== TrellisObjectStatus.DONE) {
    parent.status = TrellisObjectStatus.DONE;
    parent.log.push(
      `Auto-completed: All child ${getChildTypeName(parent.type)} are complete`,
    );
    await repository.saveObject(parent);

    // Recursively check the parent's parent
    await autoCompleteParentHierarchy(repository, parent);
  }
}

function getChildTypeName(parentType: TrellisObjectType): string {
  switch (parentType) {
    case TrellisObjectType.PROJECT:
      return "epics";
    case TrellisObjectType.EPIC:
      return "features";
    case TrellisObjectType.FEATURE:
      return "tasks";
    default:
      return "children";
  }
}
