import { TrellisObject } from "../models";

export interface Repository {
  getObjectById(id: string): Promise<TrellisObject | null>;
}
