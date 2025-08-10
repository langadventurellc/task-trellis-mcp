import { TrellisObject } from "./TrellisObject";
import { TrellisObjectStatus } from "./TrellisObjectStatus";

/**
 * Checks if a TrellisObject is claimable.
 * A claimable object has status OPEN.
 *
 * @param obj - The TrellisObject to check
 * @returns true if the object is claimable (OPEN), false otherwise
 */
export function isClaimable(obj: TrellisObject): boolean {
  return obj.status === TrellisObjectStatus.OPEN;
}
