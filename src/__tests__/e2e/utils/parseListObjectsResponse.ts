/**
 * Parses the JSON response from list_objects MCP tool calls
 * Note: Returns an array of object IDs (strings) instead of full objects
 */
export function parseListObjectsResponse(responseText: string): string[] {
  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`Failed to parse list response: ${responseText}`);
  }
}
