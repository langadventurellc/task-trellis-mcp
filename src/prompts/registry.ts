import {
  McpError,
  ErrorCode,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PromptsRegistry } from "./PromptsRegistry.js";

/**
 * Registers prompt handlers with the MCP server
 */
export async function registerPromptHandlers(server: Server): Promise<void> {
  const registry = new PromptsRegistry();

  // Initialize the registry by loading all prompts
  await registry.initialize();

  // Register prompts/list handler
  server.setRequestHandler(ListPromptsRequestSchema, () => {
    try {
      return registry.listPrompts();
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list prompts: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  });

  // Register prompts/get handler
  server.setRequestHandler(GetPromptRequestSchema, (request) => {
    try {
      const { name, arguments: args } = request.params as {
        name: string;
        arguments?: Record<string, string>;
      };

      if (!name) {
        throw new McpError(ErrorCode.InvalidRequest, "Prompt name is required");
      }

      return registry.getPrompt(name, args);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  });
}
