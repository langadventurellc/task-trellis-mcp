import type { TrellisObject } from "../../models";
import { escapeHtml } from "../escapeHtml";
import { priorityCssClass } from "./priorityCssClass";
import { statusCssClass } from "./statusCssClass";

type TreeRowOptions = {
  open?: boolean;
  hidden?: boolean;
};

/** Renders a single designer-style tree row. Depth is converted to 20px increments via --indent. */
export function treeRow(
  key: string,
  obj: TrellisObject,
  depth: number,
  opts: TreeRowOptions = {},
): string {
  const kindLetter = obj.type.charAt(0).toUpperCase();
  const hasChildren = obj.childrenIds.length > 0;
  const chevClass = hasChildren ? "chev" : "chev hidden";
  const openClass = hasChildren && opts.open ? " open" : "";
  const hiddenAttr = opts.hidden ? " hidden" : "";
  const indentPx = depth * 20;
  return `<div class="row${openClass}"${hiddenAttr} style="--indent:${indentPx}px;"
  hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(obj.id)}/detail"
  hx-target="#detail"
  hx-swap="innerHTML"
><span class="${chevClass}"><svg><use href="#i-chev"/></svg></span><span class="kind">${escapeHtml(kindLetter)}</span><span class="row-title">${escapeHtml(obj.title)}</span><span class="row-meta"><span class="sdot ${escapeHtml(statusCssClass(obj.status))}"></span><span class="pbar ${escapeHtml(priorityCssClass(obj.priority))}"></span></span></div>`;
}
