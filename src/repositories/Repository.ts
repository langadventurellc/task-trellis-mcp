import { TrellisObject } from "../models";

export interface Repository {
  getObjectById(id: string): Promise<TrellisObject | null>;
  getObjects(includeClosed?: boolean): Promise<TrellisObject[]>;
  saveObject(trellisObject: TrellisObject): Promise<void>;
  deleteObject(id: string): Promise<void>;
}
