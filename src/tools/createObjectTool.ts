import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../models";
import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const createObjectTool = {
  name: "create_object",
  description: `Creates a new object in the task trellis system

Use this tool to create new objects such as tasks, projects, or other work items within the task management hierarchy. Objects can have parent-child relationships and dependencies through prerequisites.

Available object types and hierarchy requirements:
- 'project': Top-level containers, cannot have a parent
- 'epic': Can have no parent or a project as a parent
- 'feature': Can have no parent or an epic as a parent
- 'task': Can have no parent or a feature as a parent

Supported hierarchy structures:
- Full hierarchy: project → epic → feature → task
- Simplified: epic → feature → task
- Simplified: feature → task  
- Standalone: epic
- Standalone: task

Available status values:
- 'draft': Initial state for new objects
- 'open': Ready to begin work (default)
- 'open': Ready to begin work
- 'in-progress': Currently being worked on
- 'done': Completed successfully
- 'wont-do': Cancelled or decided against

Available priority values:
- 'high': Critical or urgent work
- 'medium': Standard priority (default)
- 'low': Nice-to-have or future work

Key aspects:
- Objects support hierarchical organization via parent relationships
- Prerequisites define execution order dependencies between objects
- Parent-child relationships must follow the hierarchy rules above
- The system validates parent types during creation

Best practices:
- Use descriptive titles that clearly indicate the work to be done
- Follow the hierarchy constraints for proper organization
- Set appropriate status based on current work state
- Define prerequisites to ensure proper task ordering
- Include detailed descriptions to provide context for the work`,
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type of object to create",
      },
      title: {
        type: "string",
        description: "Title of the object",
      },
      parent: {
        type: "string",
        description: "Parent object ID (optional)",
      },
      priority: {
        type: "string",
        description: "Priority level (defaults to 'medium')",
        default: "medium",
      },
      status: {
        type: "string",
        description: "Status of the object (defaults to 'open')",
        default: "open",
      },
      prerequisites: {
        type: "array",
        items: {
          type: "string",
        },
        description:
          "Array of prerequisite object IDs (defaults to empty array)",
        default: [],
      },
      description: {
        type: "string",
        description: "Description of the object",
      },
    },
    required: ["type", "title"],
  },
} as const;

export async function handleCreateObject(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
) {
  const {
    type,
    title,
    parent,
    priority = "medium",
    status = "open",
    prerequisites = [],
    description = "",
  } = args as {
    type: string;
    title: string;
    parent?: string;
    priority?: string;
    status?: string;
    prerequisites?: string[];
    description?: string;
  };

  // Delegate to service layer
  return service.createObject(
    repository,
    type as TrellisObjectType,
    title,
    parent,
    priority as TrellisObjectPriority,
    status as TrellisObjectStatus,
    prerequisites,
    description,
  );
}
