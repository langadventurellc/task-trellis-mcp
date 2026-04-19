import type { TrellisObject } from "../../models";
import { escapeHtml } from "../escapeHtml";

function inlineBadge(cls: string, value: string): string {
  return `<span class="badge ${escapeHtml(cls)}" style="margin-right:4px;padding:2px 6px;border-radius:3px;font-size:0.8em;background:#eee">${escapeHtml(value)}</span>`;
}

/** Renders a collapsible tree node with HTMX expand and detail pane triggers. */
export function treeNode(key: string, obj: TrellisObject): string {
  const childrenId = `children-${escapeHtml(obj.id)}`;
  return `<div class="tree-node" style="margin:4px 0 4px 16px">
  <button
    hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(obj.id)}/children"
    hx-target="#${childrenId}"
    hx-swap="innerHTML"
    style="cursor:pointer;margin-right:4px"
  >&#9654;</button><span
    hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(obj.id)}/detail"
    hx-target="#detail-pane"
    hx-swap="innerHTML"
    style="cursor:pointer;text-decoration:underline"
  >${escapeHtml(obj.title)}</span>
  ${inlineBadge(`status-${obj.status}`, obj.status)}${inlineBadge(`priority-${obj.priority}`, obj.priority)}
  <div id="${childrenId}"></div>
</div>`;
}
