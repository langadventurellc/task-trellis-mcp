import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const writeProjectFileTool = {
  name: "write_project_file",
  description: `Writes a UTF-8 text file at the project's files directory (~/.trellis/projects/<key>/files/<filename>). The directory is created on demand. Files are scoped to the project and not tied to any Trellis issue. By default, overwrites an existing file with the same name. Pass \`failIfExists: true\` to instead error when a file with that name already exists. Errors if the filename contains path separators or \`..\` (path-traversal protection).`,
  inputSchema: {
    type: "object",
    properties: {
      filename: {
        type: "string",
        description:
          "Filename to write. Must not contain path separators (/, \\) or '..'. Flat namespace only — no subdirectories.",
      },
      content: {
        type: "string",
        description: "UTF-8 text content to write.",
      },
      failIfExists: {
        type: "boolean",
        description:
          "If true, the call errors when a file with the same name already exists. Defaults to false (overwrite).",
        default: false,
      },
    },
    required: ["filename", "content"],
  },
} as const;

export async function handleWriteProjectFile(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { filename, content, failIfExists } = args as {
    filename: string;
    content: string;
    failIfExists?: boolean;
  };
  return service.writeProjectFile(repository, filename, content, failIfExists);
}
