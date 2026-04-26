import type { TrellisObject } from "../../models";
import { isClosed } from "../../models";
import { computeInitialOpenSet } from "./computeInitialOpenSet";
import { treeRow } from "./treeRow";

function buildNodes(
  key: string,
  objectMap: Map<string, TrellisObject>,
  openSet: Set<string>,
  ids: string[],
  depth: number,
  parentOpen: boolean,
): string {
  return ids
    .filter((id) => objectMap.has(id))
    .map((id) => {
      const obj = objectMap.get(id)!;
      const isOpen = openSet.has(id);
      const rowHtml = treeRow(key, obj, depth, {
        open: isOpen,
        hidden: !parentOpen,
      });
      const childrenHtml =
        obj.childrenIds.length > 0
          ? buildNodes(
              key,
              objectMap,
              openSet,
              obj.childrenIds,
              depth + 1,
              isOpen,
            )
          : "";
      return rowHtml + childrenHtml;
    })
    .join("\n");
}

/** Renders the hierarchical tree. Ancestors of in-progress issues start expanded; everything else collapsed.
 * Supply `options.openSet` to override which rows start open. Pass `options.hideCompleted: true` to hide closed top-level issues (their descendants come along). */
export function renderTreeFragment(
  key: string,
  objects: TrellisObject[],
  options?: { openSet?: Set<string>; hideCompleted?: boolean },
): string {
  const objectMap = new Map(objects.map((o) => [o.id, o]));
  const roots = objects.filter(
    (o) => o.parent === null && (!options?.hideCompleted || !isClosed(o)),
  );
  const openSet = options?.openSet ?? computeInitialOpenSet(objects);
  const html = buildNodes(
    key,
    objectMap,
    openSet,
    roots.map((r) => r.id),
    0,
    true,
  );
  return (
    html || '<p class="empty" style="padding:12px 16px;">No issues found.</p>'
  );
}
