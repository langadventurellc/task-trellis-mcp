#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { ServerConfig } from "./configuration";
import { LocalRepository, Repository } from "./repositories";
import { TaskTrellisService } from "./services/TaskTrellisService";
import { LocalTaskTrellisService } from "./services/local/LocalTaskTrellisService";
import {
  activateTool,
  appendModifiedFilesTool,
  appendObjectLogTool,
  claimTaskTool,
  completeTaskTool,
  createObjectTool,
  deleteObjectTool,
  getObjectTool,
  handleAppendModifiedFiles,
  handleAppendObjectLog,
  handleClaimTask,
  handleCompleteTask,
  handleCreateObject,
  handleDeleteObject,
  handleGetObject,
  handleListObjects,
  handleUpdateObject,
  listObjectsTool,
  updateObjectTool,
} from "./tools";

// Parse command line arguments
const program = new Command();
program
  .name("task-trellis-mcp")
  .description("Task Trellis MCP Server")
  .version("1.0.0")
  .option("--mode <mode>", "Server mode", "local")
  .option("--projectRootFolder <path>", "Project root folder path")
  .option(
    "--no-auto-complete-parent",
    "Disable automatic completion of parent tasks",
  )
  .option(
    "--auto-prune <days>",
    "Auto-prune closed issues older than N days (0=disabled)",
    "0",
  );

program.parse();

interface CliOptions {
  mode?: string;
  projectRootFolder?: string;
  autoCompleteParent: boolean;
  autoPrune: string;
}

const options = program.opts<CliOptions>();

// Validate and convert auto-prune argument
const autoPruneValue = parseInt(options.autoPrune, 10);
if (isNaN(autoPruneValue)) {
  console.error(
    `Error: --auto-prune must be a numeric value, got "${options.autoPrune}"`,
  );
  process.exit(1);
}
if (autoPruneValue < 0) {
  console.error(
    `Error: --auto-prune must be a non-negative number, got ${autoPruneValue}`,
  );
  process.exit(1);
}

// Read version from package.json
function getPackageVersion(): string {
  try {
    const packageJsonPath = path.resolve(__dirname, "../package.json");
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf8"),
    ) as { version: string };
    return packageJson.version;
  } catch (error) {
    console.error(
      "Could not read version from package.json:",
      error instanceof Error ? error.message : String(error),
    );
    return "1.0.0"; // fallback version
  }
}

const packageVersion = getPackageVersion();

// Create server config - always create with at least mode set
const serverConfig: ServerConfig = {
  mode: options.mode === "remote" ? "remote" : "local",
  autoCompleteParent: options.autoCompleteParent,
  autoPrune: autoPruneValue,
  ...(options.projectRootFolder && typeof options.projectRootFolder === "string"
    ? { planningRootFolder: path.join(options.projectRootFolder, ".trellis") }
    : {}),
};

function getRepository(): Repository {
  if (serverConfig.mode === "local") {
    return new LocalRepository(serverConfig);
  } else {
    throw new Error("Remote repository not yet implemented");
  }
}

function _getService(): TaskTrellisService {
  if (serverConfig.mode === "local") {
    return new LocalTaskTrellisService();
  } else {
    throw new Error("Remote task service not yet implemented");
  }
}

const server = new Server(
  {
    name: "task-trellis-mcp",
    version: packageVersion,
    description: `An MCP server that provides structured task management and workflow orchestration for AI coding agents.

Task Trellis helps AI agents break down complex software engineering work into manageable, hierarchical tasks that can be systematically executed. The system provides a structured approach to project management with support for hierarchical organization (project → epic → feature → task), prerequisite dependencies, priority management, and comprehensive task lifecycle tracking.

Key capabilities:
- Hierarchical task organization with flexible parent-child relationships
- Prerequisite-based dependency management ensuring proper execution order
- Priority-driven task claiming and execution workflows
- Comprehensive object lifecycle management (draft → open → in-progress → done)
- File change tracking and audit trails for completed work
- Automatic task progression and dependency resolution
- Flexible scope-based task filtering and claiming
- System maintenance tools for pruning completed work

The server supports both local file-based storage and configurable remote repositories, making it suitable for individual development workflows and team collaboration. Tasks are automatically validated for readiness based on prerequisites and status, enabling autonomous agent operation while maintaining work quality and proper sequencing.

Essential for AI agents working on complex, multi-step software projects where systematic task breakdown, dependency management, and progress tracking are critical for successful completion.`,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, () => {
  const tools: unknown[] = [
    createObjectTool,
    updateObjectTool,
    getObjectTool,
    deleteObjectTool,
    listObjectsTool,
    appendObjectLogTool,
    appendModifiedFilesTool,
    claimTaskTool,
    completeTaskTool,
  ];

  // Only include activate tool if server is not properly configured from command line
  // (i.e., local mode without projectRootFolder specified)
  if (serverConfig.mode === "local" && !serverConfig.planningRootFolder) {
    tools.push(activateTool);
  }

  return { tools };
});

// eslint-disable-next-line statement-count/function-statement-count-warn
server.setRequestHandler(CallToolRequestSchema, (request) => {
  const { name: toolName, arguments: args } = request.params;

  // Validate that local mode requires planning root folder for all tools except activate
  if (
    serverConfig.mode === "local" &&
    !serverConfig.planningRootFolder &&
    toolName !== "activate"
  ) {
    return {
      content: [
        {
          type: "text",
          text: "Planning root folder is not configured. Please call the 'activate' tool with the project's root folder first.",
        },
      ],
    };
  }

  if (toolName === "activate") {
    const { mode, projectRoot, apiToken, url, remoteProjectId } = args as {
      mode: "local" | "remote";
      projectRoot?: string;
      apiToken?: string;
      url?: string;
      remoteProjectId?: string;
    };

    // Update server config based on activate parameters
    serverConfig.mode = mode;

    if (mode === "local" && projectRoot) {
      serverConfig.planningRootFolder = path.join(projectRoot, ".trellis");
    } else if (mode === "remote") {
      if (url) serverConfig.remoteRepositoryUrl = url;
      if (apiToken) serverConfig.remoteRepositoryApiToken = apiToken;
      if (remoteProjectId) serverConfig.remoteProjectId = remoteProjectId;
    }

    return {
      content: [
        {
          type: "text",
          text: `Activated in ${mode} mode. Server config updated: ${JSON.stringify(
            serverConfig,
            null,
            2,
          )}`,
        },
      ],
    };
  }

  const repository = getRepository();

  switch (toolName) {
    case "create_issue":
      return handleCreateObject(_getService(), repository, args);
    case "update_issue":
      return handleUpdateObject(_getService(), repository, args, serverConfig);
    case "get_issue":
      return handleGetObject(repository, args);
    case "delete_issue":
      return handleDeleteObject(repository, args);
    case "list_issues":
      return handleListObjects(_getService(), repository, args);
    case "append_issue_log":
      return handleAppendObjectLog(_getService(), repository, args);
    case "append_modified_files":
      return handleAppendModifiedFiles(_getService(), repository, args);
    case "claim_task":
      return handleClaimTask(_getService(), repository, args);
    case "complete_task":
      return handleCompleteTask(_getService(), repository, args, serverConfig);
    case "activate":
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startServer() {
  // Auto-prune closed objects if enabled
  if (serverConfig.autoPrune > 0) {
    try {
      console.warn(
        `Starting auto-prune for objects older than ${serverConfig.autoPrune} days...`,
      );
      const repository = getRepository();
      const service = _getService();
      const result = await service.pruneClosed(
        repository,
        serverConfig.autoPrune,
      );
      console.warn(`Auto-prune completed: ${result.content[0].text}`);
    } catch (error) {
      console.error(
        `Auto-prune failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't exit - continue starting server even if prune fails
    }
  }

  // Start the main server
  await runServer();
}

startServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
