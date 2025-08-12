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
  appendObjectLogTool,
  claimTaskTool,
  completeTaskTool,
  createObjectTool,
  deleteObjectTool,
  getObjectTool,
  handleAppendObjectLog,
  handleClaimTask,
  handleCompleteTask,
  handleCreateObject,
  handleDeleteObject,
  handleGetObject,
  handleListObjects,
  handlePruneClosed,
  handleReplaceObjectBodyRegex,
  handleUpdateObject,
  listObjectsTool,
  pruneClosedTool,
  replaceObjectBodyRegexTool,
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
    "--auto-complete-parent",
    "Enable automatic completion of parent tasks",
  );

program.parse();

interface CliOptions {
  mode?: string;
  projectRootFolder?: string;
  autoCompleteParent: boolean;
}

const options = program.opts<CliOptions>();

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
  autoCompleteParent: options.autoCompleteParent || false,
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
    replaceObjectBodyRegexTool,
    getObjectTool,
    deleteObjectTool,
    listObjectsTool,
    appendObjectLogTool,
    claimTaskTool,
    completeTaskTool,
    pruneClosedTool,
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
    case "create_object":
      return handleCreateObject(_getService(), repository, args);
    case "update_object":
      return handleUpdateObject(repository, args);
    case "replace_object_body_regex":
      return handleReplaceObjectBodyRegex(repository, args);
    case "get_object":
      return handleGetObject(repository, args);
    case "delete_object":
      return handleDeleteObject(repository, args);
    case "list_objects":
      return handleListObjects(_getService(), repository, args);
    case "append_object_log":
      return handleAppendObjectLog(_getService(), repository, args);
    case "claim_task":
      return handleClaimTask(_getService(), repository, args);
    case "complete_task":
      return handleCompleteTask(_getService(), repository, args, serverConfig);
    case "prune_closed":
      return handlePruneClosed(_getService(), repository, args);
    case "activate":
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
