/**
 * Parses the JSON response from list_objects MCP tool calls
 */
export function parseListObjectsResponse(responseText: string): any[] {
  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`Failed to parse list response: ${responseText}`);
  }
}
