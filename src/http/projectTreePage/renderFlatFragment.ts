import type { TrellisObject } from "../../models";
import { treeRow } from "./treeRow";

/** Renders a flat list of objects as tree rows at depth 0 (used for search results). */
export function renderFlatFragment(
  key: string,
  objects: TrellisObject[],
): string {
  if (objects.length === 0) return "<p>No results found.</p>";
  return objects.map((o) => treeRow(key, o, 0)).join("\n");
}
