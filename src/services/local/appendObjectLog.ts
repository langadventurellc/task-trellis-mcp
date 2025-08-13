import { Repository } from "../../repositories";

export async function appendObjectLog(
  repository: Repository,
  id: string,
  contents: string,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Load the existing object
    const existingObject = await repository.getObjectById(id);
    if (!existingObject) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Object with ID '${id}' not found`,
          },
        ],
      };
    }

    // Create updated object with new log entry appended
    const updatedObject = {
      ...existingObject,
      log: [...existingObject.log, contents],
    };

    // Save the updated object
    await repository.saveObject(updatedObject);

    return {
      content: [
        {
          type: "text",
          text: `Successfully appended to object log: ${JSON.stringify(
            { id, contents, totalLogEntries: updatedObject.log.length },
            null,
            2,
          )}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error appending to object log: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
