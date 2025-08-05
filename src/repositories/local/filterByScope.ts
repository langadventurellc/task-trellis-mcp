import { matchesScope } from "./scopeFilter";

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
