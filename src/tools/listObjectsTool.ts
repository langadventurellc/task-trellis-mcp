import {
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../models";
import { Repository } from "../repositories";

export const listObjectsTool = {
  name: "list_objects",
  description: `Lists objects from the task trellis system

Use this tool to retrieve and filter objects based on various criteria. Essential for discovering existing work items, understanding project structure, and finding objects that need attention.

Available object types:
- 'project': Top-level containers
- 'epic': Large features within projects  
- 'feature': Specific functionality within epics
- 'task': Individual work items

Available status values:
- 'draft': Initial state for new objects
- 'open': Ready to begin work (default for new objects)
- 'in-progress': Currently being worked on
- 'done': Completed successfully
- 'wont-do': Cancelled or decided against

Available priority values:
- 'high': Critical or urgent work
- 'medium': Standard priority
- 'low': Nice-to-have or future work

Key filtering options:
- 'type': Filter by object category (project, epic, feature, task)
- 'scope': Limit results to a specific project or area of work
- 'status': Find objects in particular states (draft, open, in-progress, done, wont-do)
- 'priority': Filter by importance level (high, medium, low)
- 'includeClosed': Whether to show completed/archived objects (defaults to false)

Usage patterns:
- List all tasks in progress: type='task', status='in-progress'
- Find high priority work: priority='high', includeClosed=false
- Review project scope: type='project', scope='specific-project'
- Audit completed work: includeClosed=true, status='done'
- Find cancelled items: status='wont-do', includeClosed=true

The results provide only object IDs to enable efficient filtering and selection of objects for further operations.`,
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type of objects to list",
      },
      scope: {
        type: "string",
        description: "Scope to filter objects (optional)",
      },
      status: {
        type: "string",
        description: "Status to filter objects (optional)",
      },
      priority: {
        type: "string",
        description: "Priority to filter objects (optional)",
      },
      includeClosed: {
        type: "boolean",
        description: "Include closed objects (defaults to false)",
        default: false,
      },
    },
    required: ["type"],
  },
} as const;

export async function handleListObjects(repository: Repository, args: unknown) {
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

    // Get objects from repository
    const objects = await repository.getObjects(
      includeClosed,
      scope,
      typeEnum,
      statusEnum,
      priorityEnum,
    );

    const objectIds = objects.map((obj) => obj.id);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(objectIds, null, 2),
        },
      ],
    };
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
