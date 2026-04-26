import { TrellisObjectStatus, type TrellisObject } from "../../models";

/** IDs of rows that should start expanded: in-progress issues themselves and their ancestors. */
export function computeInitialOpenSet(objects: TrellisObject[]): Set<string> {
  const byId = new Map(objects.map((o) => [o.id, o]));
  const open = new Set<string>();
  for (const o of objects) {
    if (o.status !== TrellisObjectStatus.IN_PROGRESS) continue;
    open.add(o.id);
    let parentId = o.parent;
    while (parentId && !open.has(parentId)) {
      open.add(parentId);
      parentId = byId.get(parentId)?.parent ?? null;
    }
  }
  return open;
}
