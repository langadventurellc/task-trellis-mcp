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
    type?: TrellisObjectType,
    status?: TrellisObjectStatus,
    priority?: TrellisObjectPriority,
  ): Promise<TrellisObject[]>;
  saveObject(trellisObject: TrellisObject): Promise<void>;
  deleteObject(id: string): Promise<void>;
}
