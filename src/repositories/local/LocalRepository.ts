import { ServerConfig } from "../../configuration/ServerConfig";
import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../Repository";

/**
 * Local file-based repository implementation.
 * Manages Trellis objects stored as markdown files in the local filesystem.
 */
export class LocalRepository implements Repository {
  /**
   * Creates a new LocalRepository instance.
   *
   * @param config - Server configuration containing local repository settings
   */
  constructor(private config: ServerConfig) {
    if (config.mode !== "local") {
      throw new Error("LocalRepository requires mode to be 'local'");
    }
    if (!config.planningRootFolder) {
      throw new Error(
        "LocalRepository requires planningRootFolder to be configured",
      );
    }
  }

  async getObjectById(id: string) {
    const { getObjectById } = await import("./getObjectById.js");
    return await getObjectById(id, this.config.planningRootFolder!);
  }

  async getObjects(
    includeClosed?: boolean,
    scope?: string,
    type?: TrellisObjectType | TrellisObjectType[],
    status?: TrellisObjectStatus | TrellisObjectStatus[],
    priority?: TrellisObjectPriority | TrellisObjectPriority[],
  ) {
    const { getObjects } = await import("./getObjects");
    return await getObjects(
      this.config.planningRootFolder!,
      includeClosed,
      scope,
      type,
      status,
      priority,
    );
  }

  async getChildrenOf(parentId: string, includeClosed?: boolean) {
    const { getChildrenOf } = await import("./getChildrenOf");
    return await getChildrenOf(
      parentId,
      this.config.planningRootFolder!,
      includeClosed,
    );
  }

  async saveObject(trellisObject: TrellisObject): Promise<void> {
    const { saveObject: saveObjectImpl } = await import("./saveObject");
    await saveObjectImpl(trellisObject, this.config.planningRootFolder!);
  }

  async deleteObject(id: string, force?: boolean): Promise<void> {
    const { deleteObjectById } = await import("./deleteObjectById");
    await deleteObjectById(id, this.config.planningRootFolder!, force);
  }
}
