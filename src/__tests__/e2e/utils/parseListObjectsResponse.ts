import { TrellisObjectSummary } from "../../../models/TrellisObjectSummary";

/**
 * Parses the JSON response from list_issues MCP tool calls
 * Note: Returns an array of TrellisObjectSummary instances
 */
export function parseListObjectsResponse(
  responseText: string,
): TrellisObjectSummary[] {
  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`Failed to parse list response: ${responseText}`);
  }
}
