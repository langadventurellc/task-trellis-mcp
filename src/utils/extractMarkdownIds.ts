import { basename } from "path";

/**
 * Extracts IDs from markdown file paths based on the Trellis naming convention
 *
 * In Trellis, all markdown files represent objects with IDs that match their filename (without .md).
 * This works for all object types:
 * - Projects: .trellis/p/P-project-name/P-project-name.md -> P-project-name
 * - Epics: .trellis/p/P-project/e/E-epic-name/E-epic-name.md -> E-epic-name
 * - Features: .trellis/p/P-project/e/E-epic/f/F-feature-name/F-feature-name.md -> F-feature-name
 * - Hierarchical tasks: .trellis/p/P-project/e/E-epic/f/F-feature/t/open/T-task-name.md -> T-task-name
 * - Standalone tasks: .trellis/t/open/T-task-name.md -> T-task-name
 * - Feature tasks: .trellis/f/F-feature/t/open/T-task-name.md -> T-task-name
 *
 * @param filePaths Array of file paths from findMarkdownFiles
 * @returns Array of extracted IDs (sorted alphabetically)
 */
export function extractMarkdownIds(filePaths: string[]): string[] {
  const ids: string[] = [];

  for (const filePath of filePaths) {
    // Normalize path separators to forward slashes for consistent handling
    const normalizedPath = filePath.replace(/\\/g, "/");

    // Extract the filename without .md extension as the ID
    const fileName = basename(normalizedPath, ".md");

    // Only include files that follow the Trellis naming convention (P-, E-, F-, T- prefixes)
    if (/^[PEFT]-/.test(fileName)) {
      ids.push(fileName);
    }
  }

  return ids.sort();
}
