import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const listProjectFilesTool = {
  name: "list_project_files",
  description: `Lists filenames in the project's files directory (~/.trellis/projects/<key>/files/). Returns an empty list if the directory does not yet exist.`,
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
} as const;

export async function handleListProjectFiles(
  service: TaskTrellisService,
  repository: Repository,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  return service.listProjectFiles(repository);
}
