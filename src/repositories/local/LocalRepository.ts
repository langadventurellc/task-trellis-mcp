import { TrellisObject } from "../../models";
import { Repository } from "../Repository";
import ServerConfig from "../../configuration/ServerConfig";

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
    return getObjectById(id, this.config.localRepositoryPath!);
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

  async saveObject(_trellisObject: TrellisObject) {}

  async deleteObject(id: string) {
    const { deleteObjectById } = await import("./deleteObjectById");
    return deleteObjectById(id, this.config.localRepositoryPath!);
  }
}
