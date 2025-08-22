import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { isOpen } from "../../models/isOpen";

export async function getObjects(
  planningRootFolder: string,
  includeClosed = false,
  scope?: string,
  type?: TrellisObjectType | TrellisObjectType[],
  status?: TrellisObjectStatus | TrellisObjectStatus[],
  priority?: TrellisObjectPriority | TrellisObjectPriority[],
): Promise<TrellisObject[]> {
  const { findMarkdownFiles } = await import("./findMarkdownFiles");
  const { getObjectByFilePath } = await import("./getObjectByFilePath");

  const markdownFiles = await findMarkdownFiles(
    planningRootFolder,
    true, // Always include closed files, we'll filter by status later
    scope,
  );

  // Normalize filter inputs to arrays for consistent processing
  // Treat empty arrays as undefined (no filter)
  const typeArray =
    type &&
    (Array.isArray(type) ? (type.length > 0 ? type : undefined) : [type]);
  const statusArray =
    status &&
    (Array.isArray(status)
      ? status.length > 0
        ? status
        : undefined
      : [status]);
  const priorityArray =
    priority &&
    (Array.isArray(priority)
      ? priority.length > 0
        ? priority
        : undefined
      : [priority]);

  const objects: TrellisObject[] = [];

  for (const filePath of markdownFiles) {
    try {
      const trellisObject = await getObjectByFilePath(filePath);

      // Apply type filter using array membership test
      if (typeArray && !typeArray.includes(trellisObject.type)) {
        continue; // Skip if type doesn't match any in the array
      }

      // Apply status filter using array membership test
      if (statusArray && !statusArray.includes(trellisObject.status)) {
        continue; // Skip if status doesn't match any in the array
      }

      // Apply priority filter using array membership test
      if (priorityArray && !priorityArray.includes(trellisObject.priority)) {
        continue; // Skip if priority doesn't match any in the array
      }

      if (!includeClosed && !isOpen(trellisObject)) {
        continue; // Skip closed objects if includeClosed is false
      }

      objects.push(trellisObject);
    } catch (error) {
      // Skip files that can't be deserialized (might not be valid Trellis objects)
      console.error(`Warning: Could not deserialize file ${filePath}:`, error);
      continue;
    }
  }

  return objects;
}
