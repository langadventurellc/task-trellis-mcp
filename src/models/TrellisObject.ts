import { TrellisObjectPriority } from "./TrellisObjectPriority";
import { TrellisObjectStatus } from "./TrellisObjectStatus";
import { TrellisObjectType } from "./TrellisObjectType";

export interface TrellisObject {
  id: string;
  type: TrellisObjectType;
  title: string;
  status: TrellisObjectStatus;
  priority: TrellisObjectPriority;
  parent?: string;
  prerequisites: string[];
  affectedFiles: Map<string, string>;
  log: string[];
  schema: string;
  childrenIds: string[];
  body: string;
}
