import { Repository } from "../../repositories";

/** Deletes a named file from the issue's managed attachments folder. */
export async function removeAttachment(
  repository: Repository,
  id: string,
  filename: string,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    await repository.deleteAttachment(id, filename);
    return {
      content: [
        { type: "text", text: `Attachment '${filename}' removed from ${id}` },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    };
  }
}
