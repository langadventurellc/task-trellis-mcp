import {
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../models";
import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const listObjectsTool = {
  name: "list_issues",
  description: `Lists issues from the task trellis system

Use this tool to retrieve and filter issues based on various criteria. Essential for discovering existing work items, understanding project structure, and finding issues that need attention.

Available issue types:
- 'project': Top-level containers
- 'epic': Large features within projects  
- 'feature': Specific functionality within epics
- 'task': Individual work items

Available status values:
- 'draft': Initial state for new issues
- 'open': Ready to begin work (default for new issues)
- 'in-progress': Currently being worked on
- 'done': Completed successfully
- 'wont-do': Cancelled or decided against

Available priority values:
- 'high': Critical or urgent work
- 'medium': Standard priority
- 'low': Nice-to-have or future work

Key filtering options:
- 'type': Filter by issue category (project, epic, feature, task)
- 'scope': Limit results to a specific project or area of work
- 'status': Find issues in particular states (draft, open, in-progress, done, wont-do)
- 'priority': Filter by importance level (high, medium, low)
- 'includeClosed': Whether to show completed/archived issues (defaults to false)

Usage patterns:
- List all tasks in progress: type='task', status='in-progress'
- Find high priority work: priority='high', includeClosed=false
- Review project scope: type='project', scope='specific-project'
- Audit completed work: includeClosed=true, status='done'
- Find cancelled items: status='wont-do', includeClosed=true

The results provide issue summaries (TrellisObjectSummary instances) containing id, type, title, status, priority, parent, prerequisites, childrenIds, created, and updated fields to enable efficient filtering and further operations.`,
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type of issues to list",
      },
      scope: {
        type: "string",
        description: "Scope to filter issues (optional)",
      },
      status: {
        type: "string",
        description: "Status to filter issues (optional)",
      },
      priority: {
        type: "string",
        description: "Priority to filter issues (optional)",
      },
      includeClosed: {
        type: "boolean",
        description: "Include closed issues (defaults to false)",
        default: false,
      },
    },
    required: ["type"],
  },
} as const;

export async function handleListObjects(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
) {
  const {
    type,
    scope,
    status,
    priority,
    includeClosed = false,
  } = args as {
    type: string;
    scope?: string;
    status?: string;
    priority?: string;
    includeClosed?: boolean;
  };

  // Helper function to convert type string to enum
  const toType = (typeString: string): TrellisObjectType => {
    if (
      Object.values(TrellisObjectType).includes(typeString as TrellisObjectType)
    ) {
      return typeString as TrellisObjectType;
    }
    throw new Error(`Invalid type value: ${typeString}`);
  };

  // Helper function to convert status string to enum
  const toStatus = (statusString: string): TrellisObjectStatus => {
    if (
      Object.values(TrellisObjectStatus).includes(
        statusString as TrellisObjectStatus,
      )
    ) {
      return statusString as TrellisObjectStatus;
    }
    throw new Error(`Invalid status value: ${statusString}`);
  };

  // Helper function to convert priority string to enum
  const toPriority = (priorityString: string): TrellisObjectPriority => {
    if (
      Object.values(TrellisObjectPriority).includes(
        priorityString as TrellisObjectPriority,
      )
    ) {
      return priorityString as TrellisObjectPriority;
    }
    throw new Error(`Invalid priority value: ${priorityString}`);
  };

  try {
    // Convert string parameters to enum types
    const typeEnum = toType(type);
    const statusEnum = status ? toStatus(status) : undefined;
    const priorityEnum = priority ? toPriority(priority) : undefined;

    // Delegate to service
    return await service.listObjects(
      repository,
      typeEnum,
      scope,
      statusEnum,
      priorityEnum,
      includeClosed,
    );
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error listing objects: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
