import { PromptArgument } from "./PromptArgument";

/**
 * Represents a prompt template for the Task Trellis MCP system.
 * Prompts define reusable templates with placeholders that can be filled
 * with specific arguments to generate contextualized user messages.
 */
export interface TrellisPrompt {
  /** Kebab-case identifier for the prompt (e.g., "create-project") */
  name: string;

  /** Optional human-readable title for internal use */
  title?: string;

  /** Single-sentence summary displayed in slash command help */
  description: string;

  /** List of arguments that can be provided to fill the template */
  arguments: PromptArgument[];

  /** Optional system rules extracted from <rules> tags */
  systemRules?: string;

  /** Markdown body template with placeholders for arguments */
  userTemplate: string;
}
