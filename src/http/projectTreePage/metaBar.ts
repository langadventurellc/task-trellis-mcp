import { TrellisObjectStatus, type TrellisObject } from "../../models";

/** Renders the inner HTML of the sidebar's tree-meta counts. */
export function metaBar(objects: TrellisObject[]): string {
  const total = objects.length;
  const open = objects.filter(
    (o) => o.status === TrellisObjectStatus.OPEN,
  ).length;
  const inProgress = objects.filter(
    (o) => o.status === TrellisObjectStatus.IN_PROGRESS,
  ).length;
  const done = objects.filter(
    (o) => o.status === TrellisObjectStatus.DONE,
  ).length;
  return `<span><strong>${total}</strong> issues</span>
  <span class="dot"></span>
  <span>${open} open · ${inProgress} in-progress · ${done} done</span>`;
}
