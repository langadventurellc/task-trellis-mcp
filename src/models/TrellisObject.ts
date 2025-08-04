import { TrellisObjectType } from "./TrellisObjectType";

export interface TrellisObject {
  id: string;
  type: TrellisObjectType;
  title: string;
  status: string;
  priority: string;
  prerequisites: string[];
  affectedFiles: Map<string, string>;
  log: string[];
  schema: string;
  childrenIds: string[];
  body: string;
}
