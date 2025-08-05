import { Repository } from "../repositories/Repository.js";

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

export function handleClaimTask(repository: Repository, args: unknown) {
  const {
    scope,
    taskId,
    force = false,
  } = args as {
    scope?: string;
    taskId?: string;
    force?: boolean;
  };

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Claimed task: ${JSON.stringify(
          { scope, taskId, force },
          null,
          2,
        )}`,
      },
    ],
  };
}
