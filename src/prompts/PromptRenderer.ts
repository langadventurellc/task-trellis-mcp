import { TrellisPrompt } from "./index";
import { PromptMessage } from "./PromptMessage";

/**
 * Renders prompt templates by substituting placeholders with provided arguments.
 * Handles both $ARGUMENTS blocks and individual ${argName} substitutions.
 */
export class PromptRenderer {
  /**
   * Main entry point for rendering a prompt with arguments.
   * Returns structured messages suitable for MCP API consumption.
   */
  renderPrompt(
    prompt: TrellisPrompt,
    args: Record<string, string>,
  ): PromptMessage[] {
    // Validate required arguments
    this.validateRequiredArguments(prompt, args);

    // Process template
    let renderedTemplate = prompt.userTemplate;

    // Handle $ARGUMENTS substitution
    renderedTemplate = this.substituteArguments(renderedTemplate, prompt, args);

    // Handle ${argName} placeholders
    renderedTemplate = this.substitutePlaceholders(
      renderedTemplate,
      prompt,
      args,
    );

    // Build response messages
    const messages: PromptMessage[] = [];

    // Add user message with rendered template
    messages.push({
      role: "user",
      content: { type: "text", text: renderedTemplate },
    });

    return messages;
  }

  /**
   * Validates that all required arguments are present and non-empty after trimming
   */
  private validateRequiredArguments(
    prompt: TrellisPrompt,
    args: Record<string, string>,
  ): void {
    if (!prompt.arguments) return;

    for (const arg of prompt.arguments) {
      if (arg.required) {
        const value = args[arg.name];
        if (!value || value.trim() === "") {
          throw new Error(
            `Missing required argument: ${arg.name}. ` +
              `Description: ${arg.description || "No description provided"}`,
          );
        }
      }
    }
  }

  /**
   * Handles $ARGUMENTS placeholder substitution.
   * Single 'input' argument: inject raw value
   * Multiple arguments: create formatted "Inputs" section
   */
  private substituteArguments(
    template: string,
    prompt: TrellisPrompt,
    args: Record<string, string>,
  ): string {
    const argumentsRegex = /\$ARGUMENTS/g;

    if (!argumentsRegex.test(template)) {
      return template;
    }

    // Special case: single 'input' argument
    if (
      prompt.arguments?.length === 1 &&
      prompt.arguments[0].name === "input"
    ) {
      const value = args.input || "";
      return template.replace(/\$ARGUMENTS/g, this.sanitizeValue(value));
    }

    // Multiple arguments: format as block
    const argumentsBlock = this.formatArgumentsBlock(prompt, args);
    return template.replace(/\$ARGUMENTS/g, argumentsBlock);
  }

  /**
   * Handles individual ${argName} placeholder substitution
   */
  private substitutePlaceholders(
    template: string,
    prompt: TrellisPrompt,
    args: Record<string, string>,
  ): string {
    // Match ${argName} placeholders
    const placeholderRegex = /\$\{([^}]+)\}/g;

    return template.replace(placeholderRegex, (match, argName: string) => {
      const trimmedName = argName.trim();

      // Check if argument is defined in prompt
      const argDef = prompt.arguments?.find((a) => a.name === trimmedName);

      if (trimmedName in args) {
        const value = args[trimmedName];
        return value ? this.sanitizeValue(value) : "";
      }

      // Handle missing optional arguments
      if (argDef && !argDef.required) {
        return "(not provided)";
      }

      // If argument not defined in prompt schema, leave placeholder as-is
      if (!argDef) {
        return match;
      }

      // This shouldn't happen if validateRequiredArguments was called
      throw new Error(
        `Missing required argument in placeholder: ${trimmedName}`,
      );
    });
  }

  /**
   * Formats multiple arguments as a readable "Inputs" section
   */
  private formatArgumentsBlock(
    prompt: TrellisPrompt,
    args: Record<string, string>,
  ): string {
    if (!prompt.arguments || prompt.arguments.length === 0) {
      return "";
    }

    const lines: string[] = ["## Inputs", ""];

    for (const arg of prompt.arguments) {
      const value = args[arg.name];
      const displayValue =
        value && value.trim() ? this.sanitizeValue(value) : "(not provided)";

      lines.push(`**${arg.name}**: ${displayValue}`);

      if (arg.description) {
        lines.push(`*${arg.description}*`);
      }

      lines.push("");
    }

    return lines.join("\n").trim();
  }

  /**
   * Sanitizes argument values to prevent injection attacks.
   * Escapes special characters that could break markdown formatting
   * or introduce unwanted content.
   */
  private sanitizeValue(value: string): string {
    return value
      .replace(/\\/g, "\\\\") // Escape backslashes first
      .replace(/`/g, "\\`") // Escape backticks
      .replace(/\$/g, "\\$") // Escape dollar signs
      .replace(/</g, "&lt;") // Escape HTML tags
      .replace(/>/g, "&gt;")
      .replace(/\n{3,}/g, "\n\n"); // Limit consecutive newlines
  }
}
