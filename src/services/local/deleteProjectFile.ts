import { Repository } from "../../repositories";

/** Deletes a named file from the project's files directory. */
export async function deleteProjectFile(
  repository: Repository,
  filename: string,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    await repository.deleteProjectFile(filename);
    return {
      content: [{ type: "text", text: `Project file '${filename}' deleted` }],
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
