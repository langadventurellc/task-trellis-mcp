import { TrellisObjectType } from "../../models";

const CHILD_TYPE_MAP: Partial<Record<TrellisObjectType, TrellisObjectType>> = {
  [TrellisObjectType.PROJECT]: TrellisObjectType.EPIC,
  [TrellisObjectType.EPIC]: TrellisObjectType.FEATURE,
  [TrellisObjectType.FEATURE]: TrellisObjectType.TASK,
};

/** Returns the child type for a given parent type, or null when parent is a task. */
export function deriveChildType(
  parentType: TrellisObjectType,
): TrellisObjectType | null {
  return CHILD_TYPE_MAP[parentType] ?? null;
}
