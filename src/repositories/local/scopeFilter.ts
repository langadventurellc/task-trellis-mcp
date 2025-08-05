/**
 * Filters files based on scope criteria.
 * Used to filter files to only include those within a specific scope object.
 */

/**
 * Determines if a file path matches the specified scope criteria
 * @param filePath The full path to the file
 * @param scope The scope ID to filter by (e.g., "P-project-id", "E-epic-id", "F-feature-id")
 * @returns true if the file matches the scope, false otherwise
 */
export function matchesScope(filePath: string, scope: string): boolean {
  if (!scope) {
    return true; // No scope filter means all files match
  }

  const scopePattern = `/${scope}/`;
  return filePath.includes(scopePattern);
}

/**
 * Filters an array of file paths to only include those within the specified scope
 * @param filePaths Array of file paths to filter
 * @param scope Optional scope ID to filter by (e.g., "P-project-id", "E-epic-id", "F-feature-id")
 * @returns Filtered array of file paths that match the scope
 */
export function filterByScope(filePaths: string[], scope?: string): string[] {
  if (!scope) {
    return filePaths;
  }

  return filePaths.filter((filePath) => matchesScope(filePath, scope));
}
