/**
 * Helper to parse update_issue response
 */
export function parseUpdateObjectResponse(responseText: string): any {
  const prefix = "Successfully updated object: ";
  if (!responseText.startsWith(prefix)) {
    throw new Error(`Unexpected response format: ${responseText}`);
  }
  const jsonString = responseText.substring(prefix.length);
  return JSON.parse(jsonString);
}
