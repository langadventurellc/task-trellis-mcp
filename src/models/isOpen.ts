import { TrellisObject } from "./TrellisObject";
import { TrellisObjectStatus } from "./TrellisObjectStatus";

/**
 * Checks if a TrellisObject is in an open state.
 * An open object has any status except DONE or WONT_DO.
 *
 * @param obj - The TrellisObject to check
 * @returns true if the object is open (not DONE or WONT_DO), false otherwise
 */
export function isOpen(obj: TrellisObject): boolean {
  return (
    obj.status !== TrellisObjectStatus.DONE &&
    obj.status !== TrellisObjectStatus.WONT_DO
  );
}
