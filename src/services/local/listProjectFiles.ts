import { Repository } from "../../repositories";

/** Lists filenames in the project's files directory. */
export async function listProjectFiles(
  repository: Repository,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const filenames = await repository.listProjectFiles();
    return { content: [{ type: "text", text: JSON.stringify(filenames) }] };
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
