export const activateTool = {
  name: "activate",
  description: "Activates the task trellis system in local or remote mode",
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
