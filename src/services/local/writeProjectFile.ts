import { Repository } from "../../repositories";

/** Writes a UTF-8 text file to the project's files directory. */
export async function writeProjectFile(
  repository: Repository,
  filename: string,
  content: string,
  failIfExists?: boolean,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    await repository.writeProjectFile(filename, content, failIfExists);
    return {
      content: [{ type: "text", text: `Project file '${filename}' written` }],
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
