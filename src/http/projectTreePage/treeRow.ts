import type { TrellisObject } from "../../models";
import { escapeHtml } from "../escapeHtml";
import { priorityCssClass } from "./priorityCssClass";
import { statusCssClass } from "./statusCssClass";

/** Renders a single tree row with inline --indent CSS variable for depth. */
export function treeRow(
  key: string,
  obj: TrellisObject,
  depth: number,
): string {
  const kindLetter = obj.type.charAt(0).toUpperCase();
  const chevron =
    obj.childrenIds.length > 0 ? `<span class="chevron">&#9658;</span>` : "";
  return `<div class="tree-row" style="--indent:${depth}"
  hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(obj.id)}/detail"
  hx-target="#detail"
  hx-swap="innerHTML"
><span class="kind">${escapeHtml(kindLetter)}</span><span class="status-dot ${escapeHtml(statusCssClass(obj.status))}"></span><span class="priority-bar ${escapeHtml(priorityCssClass(obj.priority))}"></span>${chevron}<span class="row-title">${escapeHtml(obj.title)}</span></div>`;
}
