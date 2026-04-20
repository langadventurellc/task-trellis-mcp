import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const addAttachmentTool = {
  name: "add_attachment",
  description: `Copies a file into the managed attachments folder for a Trellis issue.

Errors if the issue does not exist, the source file does not exist, or a file with the same name already exists in the attachments folder.`,
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the Trellis issue to attach the file to",
      },
      sourcePath: {
        type: "string",
        description: "Absolute path to the source file to copy",
      },
    },
    required: ["id", "sourcePath"],
  },
} as const;

export async function handleAddAttachment(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { id, sourcePath } = args as { id: string; sourcePath: string };
  return await service.addAttachment(repository, id, sourcePath);
}
