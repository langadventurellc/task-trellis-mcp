import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const readProjectFileTool = {
  name: "read_project_file",
  description: `Reads a UTF-8 text file from the project's files directory (~/.trellis/projects/<key>/files/<filename>). Errors if the filename contains path separators or '..', or if the file does not exist.`,
  inputSchema: {
    type: "object",
    properties: {
      filename: {
        type: "string",
        description:
          "Filename to read. Must not contain path separators or '..'.",
      },
    },
    required: ["filename"],
  },
} as const;

export async function handleReadProjectFile(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { filename } = args as { filename: string };
  return service.readProjectFile(repository, filename);
}
