import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const appendObjectLogTool = {
  name: "append_issue_log",
  description: `Appends content to an issue's log in the task trellis system

Use this tool to add progress updates, notes, or activity records to an issue's audit trail. Essential for tracking work history, documenting decisions, and maintaining transparency in task execution.

Log entry purposes:
- Record progress milestones and status changes
- Document challenges encountered and solutions applied
- Note important decisions or changes in approach
- Track time spent or resources used
- Log external dependencies or blockers
- Record completion details and outcomes

Log content guidelines:
- Use clear, descriptive entries with context
- Include timestamps (automatically added by system)
- Reference specific files, commits, or external resources when relevant
- Note any changes to scope, requirements, or approach
- Document lessons learned or insights gained

Activity tracking patterns:
- Starting work: "Started implementation of feature X"
- Progress updates: "Completed database schema changes, moving to API layer"
- Blocking issues: "Blocked on external API access, contacted team"
- Problem resolution: "Resolved memory leak by optimizing data structure"
- Completion: "Task completed, all tests passing, PR submitted"

The log creates a permanent audit trail that helps with project retrospectives, debugging issues, and understanding work evolution over time.`,
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the issue to append log to",
      },
      contents: {
        type: "string",
        description: "Contents to append to the log",
      },
    },
    required: ["id", "contents"],
  },
} as const;

export async function handleAppendObjectLog(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
) {
  const { id, contents } = args as {
    id: string;
    contents: string;
  };

  return service.appendObjectLog(repository, id, contents);
}
