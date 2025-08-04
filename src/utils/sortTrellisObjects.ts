import { TrellisObject } from "../models/TrellisObject";
import { TrellisObjectPriority } from "../models/TrellisObjectPriority";

/**
 * Sorts an array of TrellisObject by priority (high, medium, low)
 * @param objects - Array of TrellisObject to sort
 * @returns New array sorted by priority (high first, low last)
 */
export function sortTrellisObjects(objects: TrellisObject[]): TrellisObject[] {
  const priorityOrder: Record<TrellisObjectPriority, number> = {
    [TrellisObjectPriority.HIGH]: 1,
    [TrellisObjectPriority.MEDIUM]: 2,
    [TrellisObjectPriority.LOW]: 3,
  };

  return [...objects].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
