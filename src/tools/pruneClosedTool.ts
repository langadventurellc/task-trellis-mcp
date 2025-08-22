import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const pruneClosedTool = {
  name: "prune_closed",
  description: `Prunes closed issues from the task trellis system

Use this tool for maintenance and cleanup of completed, cancelled, or otherwise closed issues that are no longer needed. Essential for system hygiene and performance optimization.

Pruning criteria:
- 'age': Minimum age in minutes since issue closure (required)
- 'scope': Limit pruning to specific project or area (optional)
- Issues must be in closed states (completed, cancelled, archived)
- Issues must not have active dependencies or relationships

Safety mechanisms:
- Only removes truly closed issues (completed, cancelled, etc.)
- Validates no active issues depend on pruned items
- Preserves issues referenced by active work
- Maintains referential integrity of remaining system

Common usage patterns:
- Daily cleanup: age=1440 (24 hours)
- Weekly maintenance: age=10080 (7 days) 
- Project closure: scope='project-name', age=4320 (3 days)
- System cleanup: age=43200 (30 days)

Pruning benefits:
- Reduces database size and improves query performance
- Removes clutter from active task views
- Prevents accumulation of obsolete work items
- Maintains focus on current and relevant tasks

Use regularly as part of system maintenance to keep the task trellis clean and performant. Consider project lifecycles and audit requirements when setting age thresholds.

This operation is permanent - pruned issues cannot be recovered.`,
  inputSchema: {
    type: "object",
    properties: {
      scope: {
        type: "string",
        description: "Scope to prune issues from (optional)",
      },
      age: {
        type: "number",
        description: "Age in minutes for issues to be considered for pruning",
      },
    },
    required: ["age"],
  },
} as const;

export async function handlePruneClosed(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
) {
  const { scope, age } = args as {
    scope?: string;
    age: number;
  };

  return service.pruneClosed(repository, age, scope);
}
