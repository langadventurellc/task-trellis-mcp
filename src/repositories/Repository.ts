import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../models";

export interface Repository {
  getObjectById(id: string): Promise<TrellisObject | null>;
  getObjects(
    includeClosed?: boolean,
    scope?: string,
    type?: TrellisObjectType | TrellisObjectType[],
    status?: TrellisObjectStatus | TrellisObjectStatus[],
    priority?: TrellisObjectPriority | TrellisObjectPriority[],
  ): Promise<TrellisObject[]>;
  getChildrenOf(
    parentId: string,
    includeClosed?: boolean,
  ): Promise<TrellisObject[]>;
  saveObject(trellisObject: TrellisObject): Promise<void>;
  deleteObject(id: string, force?: boolean): Promise<void>;
  getAttachmentsFolder(id: string): Promise<string>;
  listAttachments(id: string): Promise<string[]>;
  copyAttachment(id: string, sourcePath: string): Promise<string>;
  deleteAttachment(id: string, filename: string): Promise<void>;
}
