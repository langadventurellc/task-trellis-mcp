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
