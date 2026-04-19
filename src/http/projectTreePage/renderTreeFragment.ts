import type { TrellisObject } from "../../models";
import { treeRow } from "./treeRow";

function buildNodes(
  key: string,
  objectMap: Map<string, TrellisObject>,
  ids: string[],
  depth: number,
): string {
  return ids
    .filter((id) => objectMap.has(id))
    .map((id) => {
      const obj = objectMap.get(id)!;
      const childrenHtml =
        obj.childrenIds.length > 0
          ? buildNodes(key, objectMap, obj.childrenIds, depth + 1)
          : "";
      return treeRow(key, obj, depth) + childrenHtml;
    })
    .join("\n");
}

/** Renders the full hierarchical tree fragment from a list of objects. */
export function renderTreeFragment(
  key: string,
  objects: TrellisObject[],
): string {
  const objectMap = new Map(objects.map((o) => [o.id, o]));
  const roots = objects.filter((o) => o.parent === null);
  const html = buildNodes(
    key,
    objectMap,
    roots.map((o) => o.id),
    0,
  );
  return html || "<p>No issues found.</p>";
}
