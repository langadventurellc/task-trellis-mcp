import type { TrellisObject } from "../../models";
import { escapeHtml } from "../escapeHtml";

function inlineBadge(cls: string, value: string): string {
  return `<span class="badge ${escapeHtml(cls)}" style="margin-right:4px;padding:2px 6px;border-radius:3px;font-size:0.8em;background:#eee">${escapeHtml(value)}</span>`;
}

/** Renders the detail pane HTML fragment for a single Trellis object. */
export function renderDetail(key: string, obj: TrellisObject): string {
  const prereqs =
    obj.prerequisites.length > 0
      ? `<ul>${obj.prerequisites
          .map(
            (p) =>
              `<li><span hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(p)}/detail" hx-target="#detail-pane" hx-swap="innerHTML" style="cursor:pointer;text-decoration:underline">${escapeHtml(p)}</span></li>`,
          )
          .join("")}</ul>`
      : "<p>None</p>";

  const log =
    obj.log.length > 0
      ? `<ul>${obj.log.map((entry) => `<li><pre style="margin:0;white-space:pre-wrap">${escapeHtml(entry)}</pre></li>`).join("")}</ul>`
      : "<p>None</p>";

  let filesList = "<p>None</p>";
  if (obj.affectedFiles instanceof Map && obj.affectedFiles.size > 0) {
    filesList = `<ul>${[...obj.affectedFiles.keys()].map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>`;
  }

  const bodyHtml = obj.body
    ? `<pre style="white-space:pre-wrap;background:#f5f5f5;padding:8px">${escapeHtml(obj.body)}</pre>`
    : "<p>No description.</p>";

  return `<div>
  <h2>${escapeHtml(obj.title)}</h2>
  <p>
    <span class="badge type-${escapeHtml(obj.type)}" style="margin-right:4px;padding:2px 6px;border-radius:3px;font-size:0.8em;background:#ddd">${escapeHtml(obj.type)}</span>
    ${inlineBadge(`status-${obj.status}`, obj.status)}${inlineBadge(`priority-${obj.priority}`, obj.priority)}
  </p>
  <h3>Description</h3>
  ${bodyHtml}
  <h3>Prerequisites</h3>
  ${prereqs}
  <h3>Log</h3>
  ${log}
  <h3>Modified Files</h3>
  ${filesList}
</div>`;
}
