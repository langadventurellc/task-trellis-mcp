#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Command } from "commander";
import path from "path";
import ServerConfig from "./configuration/ServerConfig.js";
import {
  activateTool,
  appendObjectLogTool,
  claimTaskTool,
  completeTaskTool,
  createObjectTool,
  deleteObjectTool,
  getObjectTool,
  handleActivate,
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
} from "./tools/index.js";

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

const server = new Server(
  {
    name: "task-trellis-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
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

  switch (toolName) {
    case "create_object":
      return handleCreateObject(args);
    case "update_object":
      return handleUpdateObject(args);
    case "get_object":
      return handleGetObject(args);
    case "delete_object":
      return handleDeleteObject(args);
    case "list_objects":
      return handleListObjects(args);
    case "append_object_log":
      return handleAppendObjectLog(args);
    case "claim_task":
      return handleClaimTask(args);
    case "complete_task":
      return handleCompleteTask(args);
    case "prune_closed":
      return handlePruneClosed(args);
    case "activate":
      return handleActivate(args);
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
