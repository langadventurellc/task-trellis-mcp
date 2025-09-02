import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { PromptManager } from "./PromptManager.js";
import { PromptRenderer } from "./PromptRenderer.js";

/**
 * Registry for MCP prompts that integrates PromptManager and PromptRenderer
 * to provide slash command functionality in Claude Code.
 */
export class PromptsRegistry {
  private manager: PromptManager;
  private renderer: PromptRenderer;

  constructor() {
    this.manager = new PromptManager();
    this.renderer = new PromptRenderer();
  }

  /**
   * Initialize the registry by loading all prompts
   */
  async initialize(): Promise<void> {
    await this.manager.load();
  }

  /**
   * Handle prompts/list endpoint - returns catalog of available prompts
   * Omits internal-only fields like title, systemRules, and userTemplate
   */
  listPrompts(): {
    prompts: Array<{
      name: string;
      description: string;
      arguments?: Array<{
        name: string;
        description: string;
        required: boolean;
      }>;
    }>;
  } {
    const allPrompts = this.manager.list();

    // Convert to catalog entries, filtering out internal fields
    const prompts = allPrompts.map((prompt) => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments.map((arg) => ({
        name: arg.name,
        description: arg.description || "",
        required: arg.required || false,
      })),
    }));

    return { prompts };
  }

  /**
   * Handle prompts/get endpoint - renders template with arguments and returns messages
   */
  getPrompt(
    name: string,
    args?: Record<string, string>,
  ): {
    description?: string;
    messages: Array<{
      role: "system" | "user";
      content: { type: "text"; text: string };
    }>;
  } {
    // Get the prompt
    const prompt = this.manager.get(name);
    if (!prompt) {
      throw new McpError(ErrorCode.InvalidRequest, `Prompt not found: ${name}`);
    }

    // Validate required arguments
    if (prompt.arguments) {
      for (const arg of prompt.arguments) {
        if (
          arg.required &&
          (!args || !args[arg.name] || !args[arg.name].trim())
        ) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Missing required argument: ${arg.name}. Description: ${arg.description || "No description provided"}`,
          );
        }
      }
    }

    // Render the prompt with provided arguments
    const messages = this.renderer.renderPrompt(prompt, args || {});

    // Convert to MCP format with rich text blocks
    const mcpMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    return {
      description: prompt.description,
      messages: mcpMessages,
    };
  }
}
