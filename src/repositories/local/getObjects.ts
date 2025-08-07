import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";

export async function getObjects(
  planningRootFolder: string,
  includeClosed = false,
  scope?: string,
  type?: TrellisObjectType,
  status?: TrellisObjectStatus,
  priority?: TrellisObjectPriority,
): Promise<TrellisObject[]> {
  const { findMarkdownFiles } = await import("./findMarkdownFiles");
  const { getObjectByFilePath } = await import("./getObjectByFilePath");

  const markdownFiles = await findMarkdownFiles(
    planningRootFolder,
    includeClosed,
    scope,
  );

  const objects: TrellisObject[] = [];

  for (const filePath of markdownFiles) {
    try {
      const trellisObject = await getObjectByFilePath(filePath);
      if (type && trellisObject.type !== type) {
        continue; // Skip if type filter is applied and doesn't match
      }
      if (status && trellisObject.status !== status) {
        continue; // Skip if status filter is applied and doesn't match
      }
      if (priority && trellisObject.priority !== priority) {
        continue; // Skip if priority filter is applied and doesn't match
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
