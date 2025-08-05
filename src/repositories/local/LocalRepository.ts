import ServerConfig from "../../configuration/ServerConfig";
import { TrellisObject } from "../../models";
import { Repository } from "../Repository";

/**
 * Local file-based repository implementation.
 * Manages Trellis objects stored as markdown files in the local filesystem.
 */
export default class LocalRepository implements Repository {
  /**
   * Creates a new LocalRepository instance.
   *
   * @param config - Server configuration containing local repository settings
   */
  constructor(private config: ServerConfig) {
    if (config.mode !== "local") {
      throw new Error("LocalRepository requires mode to be 'local'");
    }
    if (!config.localRepositoryPath) {
      throw new Error(
        "LocalRepository requires localRepositoryPath to be configured",
      );
    }
  }

  async getObjectById(id: string) {
    const { getObjectById } = await import("./getObjectById");
    return await getObjectById(id, this.config.localRepositoryPath!);
  }

  async getObjects(includeClosed?: boolean) {
    const { findMarkdownFiles } = await import("./findMarkdownFiles");
    const { getObjectByFilePath } = await import("./getObjectByFilePath");

    const markdownFiles = await findMarkdownFiles(
      this.config.localRepositoryPath!,
      includeClosed,
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

  async saveObject(trellisObject: TrellisObject): Promise<void> {
    const { saveObject: saveObjectImpl } = await import("./saveObject");
    await saveObjectImpl(trellisObject, this.config.localRepositoryPath!);
  }

  async deleteObject(id: string) {
    const { deleteObjectById } = await import("./deleteObjectById");
    return await deleteObjectById(id, this.config.localRepositoryPath!);
  }
}
