import { Repository } from "../../repositories";

/** Copies a file into the managed attachments folder. Returns stored filename on success. */
export async function addAttachment(
  repository: Repository,
  id: string,
  sourcePath: string,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const filename = await repository.copyAttachment(id, sourcePath);
    return {
      content: [
        { type: "text", text: `Attachment '${filename}' added to ${id}` },
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
