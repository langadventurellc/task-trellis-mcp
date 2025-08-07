/**
 * Helper to parse replace_object_body_regex response
 */
export function parseReplaceObjectBodyRegexResponse(responseText: string): {
  success: boolean;
  objectId?: string;
  pattern?: string;
  message: string;
} {
  // Handle successful responses
  const successPrefix =
    "Successfully replaced content in object body using pattern ";
  if (responseText.startsWith(successPrefix)) {
    // Find the last occurrence of '. Object ID: ' to split the pattern from the object ID
    const objectIdMarker = '". Object ID: ';
    const objectIdIndex = responseText.lastIndexOf(objectIdMarker);
    if (objectIdIndex !== -1) {
      const patternPart = responseText.substring(
        successPrefix.length + 1,
        objectIdIndex,
      ); // +1 to skip opening quote
      const objectId = responseText.substring(
        objectIdIndex + objectIdMarker.length,
      );
      return {
        success: true,
        pattern: patternPart,
        objectId: objectId,
        message: responseText,
      };
    }
  }

  // Handle no matches found
  if (responseText.startsWith("No matches found for pattern")) {
    const match = responseText.match(/pattern "([^"]+)"/);
    return {
      success: false,
      pattern: match?.[1],
      message: responseText,
    };
  }

  // Handle any other response (usually errors)
  return {
    success: false,
    message: responseText,
  };
}
