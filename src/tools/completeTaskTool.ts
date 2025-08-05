import { Repository } from "../repositories";

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
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of files that were changed",
      },
    },
    required: ["taskId", "summary", "filesChanged"],
  },
} as const;

export function handleCompleteTask(repository: Repository, args: unknown) {
  const { taskId, summary, filesChanged } = args as {
    taskId: string;
    summary: string;
    filesChanged: string[];
  };

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Completed task: ${JSON.stringify(
          { taskId, summary, filesChanged },
          null,
          2,
        )}`,
      },
    ],
  };
}
