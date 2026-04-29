import { Repository } from "../../repositories";

/** Reads a UTF-8 text file from the project's files directory. */
export async function readProjectFile(
  repository: Repository,
  filename: string,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const text = await repository.readProjectFile(filename);
    return { content: [{ type: "text", text }] };
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
