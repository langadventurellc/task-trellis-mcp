/**
 * Helper to parse getObject response
 */
export function parseGetObjectResponse(responseText: string): any {
  const prefix = "Retrieved object: ";
  if (!responseText.startsWith(prefix)) {
    throw new Error(`Unexpected response format: ${responseText}`);
  }
  const jsonString = responseText.substring(prefix.length);
  return JSON.parse(jsonString);
}
