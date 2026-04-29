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
  getAttachmentsFolder(obj: TrellisObject): Promise<string>;
  listAttachments(obj: TrellisObject): Promise<string[]>;
  copyAttachment(id: string, sourcePath: string): Promise<string>;
  deleteAttachment(id: string, filename: string): Promise<void>;
  writeProjectFile(
    filename: string,
    content: string,
    failIfExists?: boolean,
  ): Promise<void>;
  readProjectFile(filename: string): Promise<string>;
  listProjectFiles(): Promise<string[]>;
  deleteProjectFile(filename: string): Promise<void>;
}
