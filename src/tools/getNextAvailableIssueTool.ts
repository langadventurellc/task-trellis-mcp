import { TrellisObjectType } from "../models";
import { Repository } from "../repositories/Repository";
import { TaskTrellisService } from "../services/TaskTrellisService";

/**
 * MCP tool definition for getting the next available issue
 */
export const getNextAvailableIssueTool = {
  name: "get_next_available_issue",
  description: `Gets the next available issue of a specific type

Use this tool to find the next available issue that's ready to work on. Essential for discovering what work is available when you're ready to start on a new project, epic, feature, or task.

Behavior:
- Returns the highest priority available issue of the specified type
- Does not modify task status or claim ownership  
- Finds issues that are ready to work on (all prerequisites complete)
- Helps you discover what work is available without having to browse through all issues

Available issue types:
- 'project': Top-level containers
- 'epic': Large features within projects
- 'feature': Specific functionality within epics
- 'task': Individual work items

Required parameters:
- 'issueType': Must specify exactly one object type (project, epic, feature, or task)

Optional parameters:
- 'scope': Limits search to issues within a specific project or area (e.g., 'P-project-name')

Usage patterns:
- Find next project to work on: issueType='project'
- Find which epic to tackle next in a project: issueType='epic', scope='P-project-name'  
- Discover what feature needs work: issueType='feature'
- Get the next task ready for development: issueType='task'
- Find work within a specific project scope: issueType='task', scope='P-specific-project'

Return format:
- Success: Returns complete issue object with all metadata, prerequisites, and readiness status
- No issues available: Returns appropriate message indicating no available issues of the specified type
- Error cases: Returns error details with specific failure reasons

Essential for discovering what work is ready to be done. Use this when you need to know what project, epic, feature, or task you should work on next without having to manually browse through all the available issues.`,
  inputSchema: {
    type: "object",
    properties: {
      issueType: {
        type: "string",
        enum: ["project", "epic", "feature", "task"],
        description: "Type of issue to find (required)",
      },
      scope: {
        type: "string",
        description: "Scope to filter issues (optional)",
      },
    },
    required: ["issueType"],
  },
} as const;

/**
 * Handler for the get_next_available_issue tool
 */
export async function handleGetNextAvailableIssue(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
) {
  const { scope, issueType } = args as {
    scope?: string;
    issueType: string;
  };

  // Validate issueType is a valid enum value
  if (
    !Object.values(TrellisObjectType).includes(issueType as TrellisObjectType)
  ) {
    return {
      content: [
        {
          type: "text",
          text: `Invalid issueType: ${issueType}. Valid types: ${Object.values(TrellisObjectType).join(", ")}`,
        },
      ],
    };
  }

  try {
    // Convert to enum and delegate to service
    const issueTypeEnum = issueType as TrellisObjectType;

    return await service.getNextAvailableIssue(
      repository,
      scope,
      issueTypeEnum,
    );
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error getting next available issue: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
