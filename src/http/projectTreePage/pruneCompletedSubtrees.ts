import type { TrellisObject } from "../../models";
import { isClosed } from "../../models";

/** Removes closed (done/wont-do) subtrees and all their descendants from the object list. */
export function pruneCompletedSubtrees(
  objects: TrellisObject[],
): TrellisObject[] {
  const byId = new Map(objects.map((o) => [o.id, o]));
  const blocked = new Set<string>();

  function collect(id: string): void {
    if (blocked.has(id)) return;
    blocked.add(id);
    const obj = byId.get(id);
    if (!obj) return;
    for (const childId of obj.childrenIds) {
      collect(childId);
    }
  }

  for (const o of objects) {
    if (isClosed(o)) {
      collect(o.id);
    }
  }

  return objects.filter((o) => !blocked.has(o.id));
}
