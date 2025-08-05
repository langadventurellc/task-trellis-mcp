import { TrellisObject } from "../../models";

export async function getObjects(
  planningRootFolder: string,
  includeClosed = false,
  scope?: string,
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
      objects.push(trellisObject);
    } catch (error) {
      // Skip files that can't be deserialized (might not be valid Trellis objects)
      console.warn(`Warning: Could not deserialize file ${filePath}:`, error);
      continue;
    }
  }

  return objects;
}
