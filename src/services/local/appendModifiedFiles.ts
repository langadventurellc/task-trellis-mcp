import { Repository } from "../../repositories";
import { appendAffectedFiles } from "./appendAffectedFiles";

/**
 * Appends modified files information to a trellis object
 *
 * @param repository - The repository instance
 * @param id - The ID of the trellis object to update
 * @param filesChanged - Record of file paths to descriptions of modifications
 */
export async function appendModifiedFiles(
  repository: Repository,
  id: string,
  filesChanged: Record<string, string>,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const trellisObject = await repository.getObjectById(id);

  if (!trellisObject) {
    return {
      content: [
        {
          type: "text",
          text: `Object with ID ${id} not found`,
        },
      ],
    };
  }

  // Append the affected files to the trellis object
  appendAffectedFiles(trellisObject, filesChanged);

  // Save the updated object
  await repository.saveObject(trellisObject);

  const fileCount = Object.keys(filesChanged).length;
  const fileText = fileCount === 1 ? "file" : "files";

  return {
    content: [
      {
        type: "text",
        text: `Successfully appended ${fileCount} modified ${fileText} to object ${id}`,
      },
    ],
  };
}
