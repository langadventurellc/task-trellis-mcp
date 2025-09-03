import { TrellisObjectPriority } from "./TrellisObjectPriority";
import { TrellisObjectStatus } from "./TrellisObjectStatus";
import { TrellisObjectType } from "./TrellisObjectType";

export interface TrellisObjectSummary {
  id: string;
  type: TrellisObjectType;
  title: string;
  status: TrellisObjectStatus;
  priority: TrellisObjectPriority;
  parent: string | null;
  prerequisites: string[];
  childrenIds: string[];
  created: string;
  updated: string;
}
