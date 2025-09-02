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
  console.warn("Initializing prompts system...");
  const registry = new PromptsRegistry();

  // Initialize the registry by loading all prompts
  try {
    await registry.initialize();
    const loadedPrompts = registry.listPrompts();
    console.warn(
      `Successfully loaded ${loadedPrompts.prompts.length} prompt templates`,
    );

    // Log individual prompt names for debugging
    if (loadedPrompts.prompts.length > 0) {
      console.warn("Available prompts:");
      loadedPrompts.prompts.forEach((prompt) => {
        console.warn(`  - ${prompt.name}: ${prompt.description}`);
      });
    }
  } catch (error) {
    console.error("Warning: Failed to load prompt templates:", error);
    console.warn(
      "Continuing with empty prompts registry - prompts feature will be available but with no templates",
    );
    // Continue execution - prompts feature will be available but with no templates
  }

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

  console.warn("Prompt handlers registered successfully");
}
