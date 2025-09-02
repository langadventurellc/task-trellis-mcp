/**
 * Represents a message in a prompt response for MCP API consumption
 */
export interface PromptMessage {
  role: "system" | "user";
  content: { type: "text"; text: string };
}
