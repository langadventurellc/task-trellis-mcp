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
    const { writeProjectMeta } = await import("./writeProjectMeta");
    await writeProjectMeta(
      this.config.planningRootFolder!,
      this.config.projectLabel,
    );
    const { saveObject: saveObjectImpl } = await import("./saveObject");
    await saveObjectImpl(trellisObject, this.config.planningRootFolder!);
    const { RepoIndex } = await import("./RepoIndex");
    RepoIndex.invalidate(this.config.planningRootFolder!, trellisObject.id);
  }

  async getObjectFilePath(id: string): Promise<string | null> {
    const { RepoIndex } = await import("./RepoIndex");
    let entry = await RepoIndex.lookup(this.config.planningRootFolder!, id);
    if (!entry) {
      await RepoIndex.populate(this.config.planningRootFolder!);
      entry = await RepoIndex.lookup(this.config.planningRootFolder!, id);
    }
    return entry?.filePath ?? null;
  }

  async deleteObject(id: string, force?: boolean): Promise<void> {
    const { deleteObjectById } = await import("./deleteObjectById");
    await deleteObjectById(id, this.config.planningRootFolder!, force);
    const { RepoIndex } = await import("./RepoIndex");
    RepoIndex.invalidate(this.config.planningRootFolder!, id);
  }

  async getAttachmentsFolder(obj: TrellisObject): Promise<string> {
    const { getAttachmentsFolder } = await import("./getAttachmentsFolder.js");
    return getAttachmentsFolder(obj, this.config.planningRootFolder!);
  }

  async listAttachments(obj: TrellisObject): Promise<string[]> {
    const { listAttachments } = await import("./listAttachments.js");
    return listAttachments(obj, this.config.planningRootFolder!);
  }

  async copyAttachment(id: string, sourcePath: string): Promise<string> {
    const { copyAttachment } = await import("./copyAttachment.js");
    return copyAttachment(id, sourcePath, this.config.planningRootFolder!);
  }

  async deleteAttachment(id: string, filename: string): Promise<void> {
    const { deleteAttachment } = await import("./deleteAttachment.js");
    return deleteAttachment(id, filename, this.config.planningRootFolder!);
  }
}
