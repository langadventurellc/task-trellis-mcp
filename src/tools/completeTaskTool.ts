import { Repository } from "../repositories";
import { TrellisObjectStatus } from "../models";

export const completeTaskTool = {
  name: "complete_task",
  description: "Completes a task in the task trellis system",
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

  return {
    content: [
      {
        type: "text",
        text: `Task "${taskId}" completed successfully. Updated ${Object.keys(filesChanged).length} affected files.`,
      },
    ],
  };
}
