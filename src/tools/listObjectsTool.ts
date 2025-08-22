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
- 'type': Filter by issue category (project, epic, feature, task) - accepts single value or array
- 'scope': Limit results to a specific project or area of work
- 'status': Find issues in particular states (draft, open, in-progress, done, wont-do) - accepts single value or array
- 'priority': Filter by importance level (high, medium, low) - accepts single value or array
- 'includeClosed': Whether to show completed/archived issues (defaults to false)

Usage patterns:
- List all tasks in progress: type='task', status='in-progress'
- Find high priority work: priority='high', includeClosed=false
- Review project scope: type='project', scope='specific-project'
- Audit completed work: includeClosed=true, status='done'
- Find cancelled items: status='wont-do', includeClosed=true
- List features and tasks: type=['feature', 'task']
- List all open objects: status='open' (no type filter)
- Multiple statuses: status=['open', 'in-progress']
- Multiple priorities: priority=['high', 'medium']

The results provide issue summaries (TrellisObjectSummary instances) containing id, type, title, status, priority, parent, prerequisites, childrenIds, created, and updated fields to enable efficient filtering and further operations.`,
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: ["string", "array"],
        items: { type: "string" },
        description: "Type of issues to list (optional)",
      },
      scope: {
        type: "string",
        description: "Scope to filter issues (optional)",
      },
      status: {
        type: ["string", "array"],
        items: { type: "string" },
        description: "Status to filter issues (optional)",
      },
      priority: {
        type: ["string", "array"],
        items: { type: "string" },
        description: "Priority to filter issues (optional)",
      },
      includeClosed: {
        type: "boolean",
        description: "Include closed issues (defaults to false)",
        default: false,
      },
    },
    required: [],
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
    type?: string | string[];
    scope?: string;
    status?: string | string[];
    priority?: string | string[];
    includeClosed?: boolean;
  };

  // Enhanced helper function to convert type input to enum array
  const toTypeArray = (
    input: string | string[] | undefined,
  ): TrellisObjectType[] | undefined => {
    if (!input) return undefined;
    const values = Array.isArray(input) ? input : [input];
    if (values.length === 0) return undefined;

    const invalidValues: string[] = [];
    const validValues: TrellisObjectType[] = [];

    values.forEach((value) => {
      if (
        Object.values(TrellisObjectType).includes(value as TrellisObjectType)
      ) {
        validValues.push(value as TrellisObjectType);
      } else {
        invalidValues.push(value);
      }
    });

    if (invalidValues.length > 0) {
      throw new Error(
        `Invalid type value${invalidValues.length > 1 ? "s" : ""}: ${invalidValues.join(", ")}`,
      );
    }

    return validValues;
  };

  // Enhanced helper function to convert status input to enum array
  const toStatusArray = (
    input: string | string[] | undefined,
  ): TrellisObjectStatus[] | undefined => {
    if (!input) return undefined;
    const values = Array.isArray(input) ? input : [input];
    if (values.length === 0) return undefined;

    const invalidValues: string[] = [];
    const validValues: TrellisObjectStatus[] = [];

    values.forEach((value) => {
      if (
        Object.values(TrellisObjectStatus).includes(
          value as TrellisObjectStatus,
        )
      ) {
        validValues.push(value as TrellisObjectStatus);
      } else {
        invalidValues.push(value);
      }
    });

    if (invalidValues.length > 0) {
      throw new Error(
        `Invalid status value${invalidValues.length > 1 ? "s" : ""}: ${invalidValues.join(", ")}`,
      );
    }

    return validValues;
  };

  // Enhanced helper function to convert priority input to enum array
  const toPriorityArray = (
    input: string | string[] | undefined,
  ): TrellisObjectPriority[] | undefined => {
    if (!input) return undefined;
    const values = Array.isArray(input) ? input : [input];
    if (values.length === 0) return undefined;

    const invalidValues: string[] = [];
    const validValues: TrellisObjectPriority[] = [];

    values.forEach((value) => {
      if (
        Object.values(TrellisObjectPriority).includes(
          value as TrellisObjectPriority,
        )
      ) {
        validValues.push(value as TrellisObjectPriority);
      } else {
        invalidValues.push(value);
      }
    });

    if (invalidValues.length > 0) {
      throw new Error(
        `Invalid priority value${invalidValues.length > 1 ? "s" : ""}: ${invalidValues.join(", ")}`,
      );
    }

    return validValues;
  };

  try {
    // Convert inputs to enum arrays using enhanced helper functions
    const typeEnums = toTypeArray(type);
    const statusEnums = toStatusArray(status);
    const priorityEnums = toPriorityArray(priority);

    // Validate that at least one filter is provided when type is optional
    if (!typeEnums && !statusEnums && !priorityEnums && !scope) {
      throw new Error(
        "At least one filter parameter (type, status, priority, or scope) must be provided",
      );
    }

    // Convert arrays back to single values or keep as arrays based on service signature
    const typeParam = typeEnums
      ? typeEnums.length === 1
        ? typeEnums[0]
        : typeEnums
      : undefined;
    const statusParam = statusEnums
      ? statusEnums.length === 1
        ? statusEnums[0]
        : statusEnums
      : undefined;
    const priorityParam = priorityEnums
      ? priorityEnums.length === 1
        ? priorityEnums[0]
        : priorityEnums
      : undefined;

    // Delegate to service
    return await service.listObjects(
      repository,
      typeParam,
      scope,
      statusParam,
      priorityParam,
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
