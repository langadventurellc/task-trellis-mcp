#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Command } from "commander";
import path from "path";
import { ServerConfig } from "./configuration";
import { LocalRepository, Repository } from "./repositories";
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
  handleUpdateObject,
  listObjectsTool,
  pruneClosedTool,
  updateObjectTool,
} from "./tools";

// Parse command line arguments
const program = new Command();
program
  .name("task-trellis-mcp")
  .description("Task Trellis MCP Server")
  .version("1.0.0")
  .option("--mode <mode>", "Server mode", "local")
  .option("--projectRootFolder <path>", "Project root folder path");

program.parse();

interface CliOptions {
  mode?: string;
  projectRootFolder?: string;
}

const options = program.opts<CliOptions>();

// Create server config - always create with at least mode set
const serverConfig: ServerConfig = {
  mode: options.mode === "remote" ? "remote" : "local",
  ...(options.projectRootFolder && typeof options.projectRootFolder === "string"
    ? { planningRootFolder: path.join(options.projectRootFolder, ".trellis") }
    : {}),
};

// eslint-disable-next-line no-console
console.log("Server configuration:", serverConfig);

function getRepository(): Repository {
  if (serverConfig.mode === "local") {
    return new LocalRepository(serverConfig);
  } else {
    throw new Error("Remote repository not yet implemented");
  }
}

const server = new Server(
  {
    name: "task-trellis-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, () => {
  return {
    tools: [
      createObjectTool,
      updateObjectTool,
      getObjectTool,
      deleteObjectTool,
      listObjectsTool,
      appendObjectLogTool,
      claimTaskTool,
      completeTaskTool,
      pruneClosedTool,
      activateTool,
    ],
  };
});

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
            2
          )}`,
        },
      ],
    };
  }

  const repository = getRepository();

  switch (toolName) {
    case "create_object":
      return handleCreateObject(repository, args);
    case "update_object":
      return handleUpdateObject(repository, args);
    case "get_object":
      return handleGetObject(repository, args);
    case "delete_object":
      return handleDeleteObject(repository, args);
    case "list_objects":
      return handleListObjects(repository, args);
    case "append_object_log":
      return handleAppendObjectLog(repository, args);
    case "claim_task":
      return handleClaimTask(repository, args);
    case "complete_task":
      return handleCompleteTask(repository, args);
    case "prune_closed":
      return handlePruneClosed(repository, args);
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
