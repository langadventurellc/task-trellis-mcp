const URI_PREFIX = "trellis://issue/";

/** Returns the trellis resource URI for an issue. */
export function buildIssueUri(id: string): string {
  return `${URI_PREFIX}${id}`;
}
