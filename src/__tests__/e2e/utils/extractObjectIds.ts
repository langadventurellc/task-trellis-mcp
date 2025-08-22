import { parseListObjectsResponse } from "./parseListObjectsResponse";

/**
 * Extracts just the IDs from a list_issues response for backward compatibility
 */
export function extractObjectIds(responseText: string): string[] {
  const summaries = parseListObjectsResponse(responseText);
  return summaries.map((summary) => summary.id);
}
