#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
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
} from "./tools";

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

  if (toolName === "create_object") {
    return handleCreateObject(args);
  }

  if (toolName === "update_object") {
    return handleUpdateObject(args);
  }

  if (toolName === "get_object") {
    return handleGetObject(args);
  }

  if (toolName === "delete_object") {
    return handleDeleteObject(args);
  }

  if (toolName === "list_objects") {
    return handleListObjects(args);
  }

  if (toolName === "append_object_log") {
    return handleAppendObjectLog(args);
  }

  if (toolName === "claim_task") {
    return handleClaimTask(args);
  }

  if (toolName === "complete_task") {
    return handleCompleteTask(args);
  }

  if (toolName === "prune_closed") {
    return handlePruneClosed(args);
  }

  if (toolName === "activate") {
    return handleActivate(args);
  }

  throw new Error(`Unknown tool: ${toolName}`);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
