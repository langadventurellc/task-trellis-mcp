import { ServerConfig } from "../../configuration";
import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
} from "../../models";
import { Repository } from "../../repositories";
import {
  autoCompleteParentHierarchy,
  updateParentHierarchy,
} from "../../utils";
import { validateLabels } from "../../validation/validateLabels";
import { validateStatusTransition } from "../../validation/validateStatusTransition";

export async function updateObject(
  repository: Repository,
  serverConfig: ServerConfig,
  id: string,
  title?: string,
  priority?: TrellisObjectPriority,
  prerequisites?: string[],
  body?: string,
  status?: TrellisObjectStatus,
  force: boolean = false,
  externalIssueId?: string,
  labels?: string[],
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

    // externalIssueId is only allowed on top-level issues (no parent)
    const droppedExternalIssueId =
      existingObject.parent !== null && externalIssueId !== undefined;

    if (labels !== undefined) {
      validateLabels(labels);
    }

    // Create updated object with new properties, ensuring proper typing
    const updatedObject: TrellisObject = {
      ...existingObject,
      ...(title && { title }),
      ...(priority && { priority }),
      ...(prerequisites && { prerequisites }),
      ...(body && { body }),
      ...(status && { status }),
      ...(externalIssueId !== undefined &&
        !droppedExternalIssueId && {
          externalIssueId: externalIssueId || undefined,
        }),
      ...(labels !== undefined ? { labels } : {}),
    };

    // Validate status transition
    if (status && !force) {
      await validateStatusTransition(updatedObject, repository);
    }

    // Save the updated object
    await repository.saveObject(updatedObject);

    // If status is being changed to in-progress, update parent hierarchy
    if (
      status === TrellisObjectStatus.IN_PROGRESS &&
      existingObject.status !== TrellisObjectStatus.IN_PROGRESS
    ) {
      try {
        await updateParentHierarchy(updatedObject.parent, repository);
      } catch (error) {
        // Log but don't propagate parent hierarchy update errors
        console.warn("Failed to update parent hierarchy:", error);
      }
    }

    // If status is being changed to done or wont-do, auto-complete parent hierarchy (if enabled)
    if (
      (status === TrellisObjectStatus.DONE ||
        status === TrellisObjectStatus.WONT_DO) &&
      existingObject.status !== status &&
      serverConfig.autoCompleteParent
    ) {
      try {
        await autoCompleteParentHierarchy(repository, updatedObject);
      } catch (error) {
        // Log but don't propagate parent hierarchy update errors
        console.warn("Failed to auto-complete parent hierarchy:", error);
      }
    }

    const content: Array<{ type: string; text: string }> = [
      {
        type: "text",
        text: `Successfully updated object: ${JSON.stringify(
          updatedObject,
          null,
          2,
        )}`,
      },
    ];

    if (droppedExternalIssueId) {
      content.push({
        type: "text",
        text: "Warning: externalIssueId ignored (only allowed on top-level issues)",
      });
    }

    return { content };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error updating object: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
