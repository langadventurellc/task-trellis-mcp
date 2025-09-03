/**
 * Represents an argument that can be passed to a prompt template.
 * All argument values are treated as strings in the API, but the type
 * hint provides guidance for internal processing and validation.
 */
export interface PromptArgument {
  /** Name of the argument, used as placeholder in templates */
  name: string;

  /** Internal type hint for argument processing */
  type?: "string" | "boolean";

  /** Whether this argument must be provided */
  required: boolean;

  /** Description of the argument's purpose and expected values */
  description: string;
}
