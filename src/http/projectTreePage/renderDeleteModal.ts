import type { TrellisObject } from "../../models";
import { escapeHtml } from "../escapeHtml";
import { typeLabel } from "./typeLabel";

/** Renders the designer's .modal-backdrop / .modal delete-confirm fragment. */
export function renderDeleteModal(
  key: string,
  obj: TrellisObject,
  dependents: TrellisObject[],
): string {
  const warnBlock =
    dependents.length > 0
      ? `<div class="warn">
  <svg><use href="#i-alert"/></svg>
  <div>
    <strong>${dependents.length} issue${dependents.length === 1 ? "" : "s"}</strong> list${dependents.length === 1 ? "s" : ""} this as a prerequisite — ${dependents.length === 1 ? "it" : "they"} will be unlinked on delete.
    <ul style="margin:6px 0 0;padding-left:18px;">${dependents
      .map(
        (d) =>
          `<li><code style="font-family:var(--font-mono);font-size:11px;">${escapeHtml(d.id)}</code> ${escapeHtml(d.title)}</li>`,
      )
      .join("")}</ul>
  </div>
</div>`
      : "";

  return `<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="del-title">
  <div class="modal">
    <div class="icon-circle">
      <svg><use href="#i-alert"/></svg>
    </div>
    <h3 id="del-title">Delete this issue?</h3>
    <p>This will permanently remove the issue and its log. It can't be undone.</p>
    <div class="target">
      <span class="t-title">${escapeHtml(obj.title)}</span>
      <span class="t-meta">
        <span>${escapeHtml(obj.id)}</span>
        <span>·</span>
        <span>${escapeHtml(typeLabel(obj.type))}</span>
        <span>·</span>
        <span>${escapeHtml(obj.status)}</span>
      </span>
    </div>
    ${warnBlock}
    <div class="footer">
      <button type="button" class="btn" onclick="document.getElementById('modal').innerHTML=''">Cancel</button>
      <button type="button" class="btn danger-solid"
        hx-delete="/projects/${escapeHtml(key)}/issues/${escapeHtml(obj.id)}"
        hx-target="#detail"
        hx-swap="innerHTML">
        <svg><use href="#i-trash"/></svg> Delete issue
      </button>
    </div>
  </div>
</div>`;
}
