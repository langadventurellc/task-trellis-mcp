import { join } from "path";
import { TrellisObject } from "../../models/TrellisObject";
import { TrellisObjectType } from "../../models/TrellisObjectType";
import { TrellisObjectStatus } from "../../models/TrellisObjectStatus";
import { getObjectById } from "./getObjectById";

/**
 * Generates the file path for a Trellis object based on its type, hierarchy, and status.
 * This function assumes the object is new and doesn't have an existing file.
 */
export async function getObjectFilePath(
  trellisObject: TrellisObject,
  planningRoot: string,
): Promise<string> {
  const { id, type, parent } = trellisObject;

  switch (type) {
    case TrellisObjectType.PROJECT:
      return join(planningRoot, "p", id, `${id}.md`);

    case TrellisObjectType.EPIC:
      if (!parent) {
        throw new Error(`Epic ${id} must have a parent project`);
      }
      return join(planningRoot, "p", parent, "e", id, `${id}.md`);

    case TrellisObjectType.FEATURE: {
      if (!parent) {
        // Feature without parent - standalone feature
        return join(planningRoot, "f", id, `${id}.md`);
      }

      // Feature with parent - need to determine if parent is epic or project
      const parentObject = await getObjectById(parent, planningRoot);

      if (!parentObject) {
        throw new Error(`Parent object with ID '${parent}' not found`);
      }

      if (parentObject.type === TrellisObjectType.EPIC) {
        // Feature under epic - need to get the project ID from the epic
        if (!parentObject.parent) {
          throw new Error(`Epic ${parent} must have a parent project`);
        }
        return join(
          planningRoot,
          "p",
          parentObject.parent,
          "e",
          parent,
          "f",
          id,
          `${id}.md`,
        );
      } else {
        throw new Error(`Feature ${id} parent must be an epic`);
      }
    }

    case TrellisObjectType.TASK:
      return await getTaskFilePath(trellisObject, planningRoot);

    default:
      throw new Error(`Unknown object type: ${String(type)}`);
  }
}

/**
 * Helper function to determine the file path for a task based on its parent hierarchy and status.
 */
async function getTaskFilePath(
  trellisObject: TrellisObject,
  planningRoot: string,
): Promise<string> {
  const { id, parent, status } = trellisObject;

  // Determine if status is closed (done or wont-do)
  const isClosed =
    status === TrellisObjectStatus.DONE ||
    status === TrellisObjectStatus.WONT_DO;
  const statusFolder = isClosed ? "closed" : "open";

  if (!parent) {
    // Task without parent - standalone task
    return join(planningRoot, "t", statusFolder, `${id}.md`);
  }

  // Task with parent - need to determine parent type and hierarchy
  const parentObject = await getObjectById(parent, planningRoot);

  if (!parentObject) {
    throw new Error(`Parent object with ID '${parent}' not found`);
  }

  if (parentObject.type === TrellisObjectType.FEATURE) {
    if (!parentObject.parent) {
      // Feature doesn't have parent - task goes under standalone feature
      return join(planningRoot, "f", parent, "t", statusFolder, `${id}.md`);
    }

    // Feature has parent (epic) - need to get full hierarchy
    const epicObject = await getObjectById(parentObject.parent, planningRoot);

    if (!epicObject) {
      throw new Error(`Epic object with ID '${parentObject.parent}' not found`);
    }

    if (epicObject.type !== TrellisObjectType.EPIC) {
      throw new Error(`Feature parent ${parentObject.parent} must be an epic`);
    }

    if (!epicObject.parent) {
      throw new Error(`Epic ${epicObject.id} must have a parent project`);
    }

    // Task under feature under epic under project
    return join(
      planningRoot,
      "p",
      epicObject.parent,
      "e",
      epicObject.id,
      "f",
      parent,
      "t",
      statusFolder,
      `${id}.md`,
    );
  } else {
    throw new Error(`Task ${id} parent must be a feature`);
  }
}
