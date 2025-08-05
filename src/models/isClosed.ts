import { TrellisObject } from "./TrellisObject";
import { TrellisObjectStatus } from "./TrellisObjectStatus";

/**
 * Checks if a TrellisObject is in a closed state.
 * A closed object has status DONE or WONT_DO.
 *
 * @param obj - The TrellisObject to check
 * @returns true if the object is closed (DONE or WONT_DO), false otherwise
 */
export function isClosed(obj: TrellisObject): boolean {
  return (
    obj.status === TrellisObjectStatus.DONE ||
    obj.status === TrellisObjectStatus.WONT_DO
  );
}
