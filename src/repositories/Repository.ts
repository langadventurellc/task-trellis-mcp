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
  saveObject(trellisObject: TrellisObject): Promise<void>;
  deleteObject(id: string, force?: boolean): Promise<void>;
}
