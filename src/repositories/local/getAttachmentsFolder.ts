import { join } from "path";
import { type TrellisObject, TrellisObjectType } from "../../models";
import { getObjectById } from "./getObjectById";

function epicFolder(id: string, parent: string | null, root: string): string {
  if (!parent) return join(root, "e", id, "attachments");
  return join(root, "p", parent, "e", id, "attachments");
}

async function featureFolder(
  id: string,
  parent: string,
  root: string,
): Promise<string> {
  const epic = await getObjectById(parent, root);
  if (!epic) throw new Error(`Parent object with ID '${parent}' not found`);
  if (epic.type !== TrellisObjectType.EPIC)
    throw new Error(`Feature ${id} parent must be an epic`);
  if (!epic.parent) return join(root, "e", parent, "f", id, "attachments");
  return join(root, "p", epic.parent, "e", parent, "f", id, "attachments");
}

async function taskFolder(
  id: string,
  parent: string | null,
  root: string,
): Promise<string> {
  if (!parent) return join(root, "t", "attachments", id);
  const feature = await getObjectById(parent, root);
  if (!feature) throw new Error(`Parent object with ID '${parent}' not found`);
  if (feature.type !== TrellisObjectType.FEATURE)
    throw new Error(`Task ${id} parent must be a feature`);
  if (!feature.parent) return join(root, "f", parent, "t", "attachments", id);
  const epic = await getObjectById(feature.parent, root);
  if (!epic)
    throw new Error(`Parent object with ID '${feature.parent}' not found`);
  if (epic.type !== TrellisObjectType.EPIC)
    throw new Error(`Feature parent ${feature.parent} must be an epic`);
  if (!epic.parent)
    return join(root, "e", feature.parent, "f", parent, "t", "attachments", id);
  return join(
    root,
    "p",
    epic.parent,
    "e",
    feature.parent,
    "f",
    parent,
    "t",
    "attachments",
    id,
  );
}

/**
 * Returns the managed attachments folder path for any issue type.
 * Traverses the parent chain for tasks and features to build the correct path.
 * Accepts a pre-loaded object to avoid redundant getObjectById calls.
 */
export async function getAttachmentsFolder(
  obj: TrellisObject,
  planningRoot: string,
): Promise<string> {
  switch (obj.type) {
    case TrellisObjectType.PROJECT:
      return join(planningRoot, "p", obj.id, "attachments");
    case TrellisObjectType.EPIC:
      return epicFolder(obj.id, obj.parent, planningRoot);
    case TrellisObjectType.FEATURE:
      if (!obj.parent) return join(planningRoot, "f", obj.id, "attachments");
      return featureFolder(obj.id, obj.parent, planningRoot);
    case TrellisObjectType.TASK:
      return taskFolder(obj.id, obj.parent, planningRoot);
    default:
      throw new Error(`Unknown object type: ${String(obj.type)}`);
  }
}
