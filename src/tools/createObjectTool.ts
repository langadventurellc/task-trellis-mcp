import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../models";
import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const createObjectTool = {
  name: "create_issue",
  description: `Creates a new issue in the task trellis system

Use this tool to create new issues such as tasks, projects, or other work items within the task management hierarchy. Issues can have parent-child relationships and dependencies through prerequisites.

Available issue types and hierarchy requirements:
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
- 'draft': Initial state for new issues
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
- Issues support hierarchical organization via parent relationships
- Prerequisites define execution order dependencies between issues
- Parent-child relationships must follow the hierarchy rules above
- The system validates parent types during creation

Best practices:
- Use descriptive titles that clearly indicate the work to be done
- Follow the hierarchy constraints for proper organization
- Set appropriate status based on current work state
- Define prerequisites to ensure proper task ordering
- Include detailed descriptions to provide context for the work

Optional \`externalIssueId\` (e.g., a Jira key) can be provided for top-level issues. When set on a child issue, the field is silently dropped and a warning is included in the response.`,
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type of issue to create",
      },
      title: {
        type: "string",
        description: "Title of the issue",
      },
      parent: {
        type: "string",
        description: "Parent issue ID (optional)",
      },
      priority: {
        type: "string",
        description: "Priority level (defaults to 'medium')",
        default: "medium",
      },
      status: {
        type: "string",
        description: "Status of the issue (defaults to 'open')",
        default: "open",
      },
      prerequisites: {
        type: "array",
        items: {
          type: "string",
        },
        description:
          "Array of prerequisite issue IDs (defaults to empty array)",
        default: [],
      },
      description: {
        type: "string",
        description: "Description of the issue",
      },
      externalIssueId: {
        type: "string",
        description:
          "Optional external system identifier (e.g., a Jira key). Only stored on top-level issues (no parent). Silently dropped with a warning when provided on a child issue.",
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
    externalIssueId,
  } = args as {
    type: string;
    title: string;
    parent?: string;
    priority?: string;
    status?: string;
    prerequisites?: string[];
    description?: string;
    externalIssueId?: string;
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
    externalIssueId,
  );
}
