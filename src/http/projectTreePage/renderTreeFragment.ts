import type { TrellisObject } from "../../models";
import { computeInitialOpenSet } from "./computeInitialOpenSet";
import { pruneCompletedSubtrees } from "./pruneCompletedSubtrees";
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
 * Supply `options.openSet` to override which rows start open. Pass `options.hideCompleted: true` to prune done/wont-do subtrees before rendering. */
export function renderTreeFragment(
  key: string,
  objects: TrellisObject[],
  options?: { openSet?: Set<string>; hideCompleted?: boolean },
): string {
  const visible = options?.hideCompleted
    ? pruneCompletedSubtrees(objects)
    : objects;
  const objectMap = new Map(visible.map((o) => [o.id, o]));
  const roots = visible.filter((o) => o.parent === null);
  const openSet = options?.openSet ?? computeInitialOpenSet(visible);
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
