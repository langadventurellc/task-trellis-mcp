const URI_PATTERN = /^trellis:\/\/issue\/([^?#]+)$/;

/**
 * Extracts the issue ID from a `trellis://issue/<id>` URI.
 * Returns null for any malformed input: wrong scheme, wrong case, missing `issue/` segment,
 * empty id, or query string / fragment present.
 */
export function parseIssueUri(uri: string): string | null {
  const match = URI_PATTERN.exec(uri);
  return match ? match[1] : null;
}
