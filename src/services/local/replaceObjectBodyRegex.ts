import { TrellisObject } from "../../models";
import { Repository } from "../../repositories";
import { MultipleMatchesError } from "../../utils/MultipleMatchesError";
import { replaceStringWithRegex } from "../../utils/replaceStringWithRegex";

export async function replaceObjectBodyRegex(
  repository: Repository,
  id: string,
  regex: string,
  replacement: string,
  allowMultipleOccurrences: boolean = false,
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

    // Check if the object has a body to replace
    if (!existingObject.body) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Object with ID '${id}' has no body content to replace`,
          },
        ],
      };
    }

    // Perform the regex replacement on the body
    const updatedBody = replaceStringWithRegex(existingObject.body, {
      regex,
      replacement,
      allowMultipleOccurrences,
    });

    // If the body didn't change, inform the user
    if (updatedBody === existingObject.body) {
      return {
        content: [
          {
            type: "text",
            text: `No matches found for pattern "${regex}" in object body. Body remains unchanged.`,
          },
        ],
      };
    }

    // Create updated object with the new body
    const updatedObject: TrellisObject = {
      ...existingObject,
      body: updatedBody,
    };

    // Save the updated object
    await repository.saveObject(updatedObject);

    return {
      content: [
        {
          type: "text",
          text: `Successfully replaced content in object body using pattern "${regex}". Object ID: ${id}`,
        },
      ],
    };
  } catch (error) {
    if (error instanceof MultipleMatchesError) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Error replacing object body: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
