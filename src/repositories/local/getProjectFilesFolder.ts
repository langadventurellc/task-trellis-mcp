import { join } from "path";

/** Returns the path to the project-scoped files directory: `<planningRoot>/files`. */
export function getProjectFilesFolder(planningRoot: string): string {
  return join(planningRoot, "files");
}
