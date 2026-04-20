import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const removeAttachmentTool = {
  name: "remove_attachment",
  description: `Deletes a named file from the managed attachments folder for a Trellis issue.

Errors if the issue does not exist or the named file does not exist.`,
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the Trellis issue to remove the attachment from",
      },
      filename: {
        type: "string",
        description: "Name of the attachment file to delete",
      },
    },
    required: ["id", "filename"],
  },
} as const;

export async function handleRemoveAttachment(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { id, filename } = args as { id: string; filename: string };
  return await service.removeAttachment(repository, id, filename);
}
