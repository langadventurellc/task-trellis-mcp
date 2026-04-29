import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const deleteProjectFileTool = {
  name: "delete_project_file",
  description: `Deletes a named file from the project's files directory (~/.trellis/projects/<key>/files/<filename>). Errors if the filename contains path separators or '..', or if the file does not exist.`,
  inputSchema: {
    type: "object",
    properties: {
      filename: {
        type: "string",
        description:
          "Filename to delete. Must not contain path separators or '..'.",
      },
    },
    required: ["filename"],
  },
} as const;

export async function handleDeleteProjectFile(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { filename } = args as { filename: string };
  return service.deleteProjectFile(repository, filename);
}
