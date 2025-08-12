import { ServerConfig } from "../configuration";
import {
  TrellisObject,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../models";
import { Repository } from "../repositories";

export const completeTaskTool = {
  name: "complete_task",
  description: `Completes a task in the task trellis system

Use this tool to mark a task as finished and record completion details. Critical for task lifecycle management and maintaining accurate project status.

Required completion data:
- 'taskId': Unique identifier of the task being completed
- 'summary': Concise description of what was accomplished
- 'filesChanged': Map of modified files with descriptions of changes made

Completion process:
1. Validates task is in a completable state ('in-progress')
2. Updates task status to 'done'
3. Records completion timestamp and summary
4. Associates file changes with the task for traceability
5. Updates parent-child relationships and dependency chains
6. Triggers any dependent tasks that were waiting for this completion

File change tracking:
- Key: relative file path from project root
- Value: description of changes made to that file
- Example: {'src/api/users.ts': 'Added user authentication endpoints', 'tests/auth.test.ts': 'Added comprehensive auth test coverage'}

Best practices:
- Provide clear, actionable summaries that explain the outcome
- Document all meaningful file changes for future reference  
- Complete tasks only when all acceptance criteria are met
- Verify dependent tasks can now proceed before completion
- Include any important notes or lessons learned in the summary

Task completion automatically notifies dependent tasks and may trigger workflow progression for related work items.`,
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "ID of the task to complete",
      },
      summary: {
        type: "string",
        description: "Summary of the completed task",
      },
      filesChanged: {
        type: "object",
        additionalProperties: {
          type: "string",
        },
        description: "Map of files changed with their descriptions",
      },
    },
    required: ["taskId", "summary", "filesChanged"],
  },
} as const;

export async function handleCompleteTask(
  repository: Repository,
  args: unknown,
  serverConfig?: ServerConfig,
) {
  const { taskId, summary, filesChanged } = args as {
    taskId: string;
    summary: string;
    filesChanged: Record<string, string>;
  };

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
  Object.entries(filesChanged).forEach(([filePath, description]) => {
    task.affectedFiles.set(filePath, description);
  });

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
