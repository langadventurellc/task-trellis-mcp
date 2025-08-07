export const activateTool = {
  name: "activate",
  description: `Activates the task trellis system in local or remote mode

Use this tool to initialize and configure the task trellis system for operation. Must be called before any other task management operations can be performed.

Activation modes:
- 'local': Uses local file system for task storage and management
- 'remote': Connects to remote task trellis service via API

Local mode requirements:
- 'projectRoot': Absolute path to project directory where tasks will be stored
- Creates local .task-trellis directory for data persistence
- Suitable for single-user development workflows
- No network dependencies once activated

Remote mode requirements:  
- 'apiToken': Authentication token for remote service access
- 'remoteProjectId': Unique identifier for remote project instance
- 'url': Service endpoint (optional, uses default if not specified)
- Enables collaborative task management across distributed teams
- Requires network connectivity for all operations

Activation process:
1. Validates mode-specific parameters and connectivity
2. Initializes data storage (local directory or remote connection)
3. Verifies authentication and permissions
4. Sets up task trellis schema and configuration
5. Prepares system for task creation and management

Error conditions:
- Invalid projectRoot path (local mode)
- Authentication failure (remote mode)
- Network connectivity issues (remote mode)
- Insufficient file system permissions (local mode)

Must be successfully completed before using any other task trellis tools. Re-activation with different parameters switches modes and resets system state.`,
  inputSchema: {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["local", "remote"],
        description: "Mode to activate (local or remote)",
      },
      projectRoot: {
        type: "string",
        description: "Project root path (required for local mode)",
      },
      apiToken: {
        type: "string",
        description: "API token (required for remote mode)",
      },
      url: {
        type: "string",
        description: "URL for remote mode (optional, for non-standard URLs)",
      },
      remoteProjectId: {
        type: "string",
        description: "Remote project ID (required for remote mode)",
      },
    },
    required: ["mode"],
  },
} as const;

export function handleActivate(args: unknown) {
  const { mode, projectRoot, apiToken, url } = args as {
    mode: "local" | "remote";
    projectRoot?: string;
    apiToken?: string;
    url?: string;
  };

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Activated: ${JSON.stringify(
          { mode, projectRoot, apiToken, url },
          null,
          2,
        )}`,
      },
    ],
  };
}
