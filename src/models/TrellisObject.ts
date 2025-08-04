import { TrellisObjectType } from "./TrellisObjectType";
import { TrellisObjectStatus } from "./TrellisObjectStatus";
import { TrellisObjectPriority } from "./TrellisObjectPriority";

export interface TrellisObject {
  id: string;
  type: TrellisObjectType;
  title: string;
  status: TrellisObjectStatus;
  priority: TrellisObjectPriority;
  prerequisites: string[];
  affectedFiles: Map<string, string>;
  log: string[];
  schema: string;
  childrenIds: string[];
  body: string;
}
