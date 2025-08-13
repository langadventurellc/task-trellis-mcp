import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

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

export async function handleClaimTask(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
) {
  const {
    scope,
    taskId,
    force = false,
  } = args as {
    scope?: string;
    taskId?: string;
    force?: boolean;
  };

  return service.claimTask(repository, scope, taskId, force);
}
