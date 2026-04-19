import type { TrellisObject } from "../../models";
import { escapeHtml } from "../escapeHtml";

/** Renders the delete-confirm modal HTML fragment for a Trellis object. */
export function renderDeleteModal(
  key: string,
  obj: TrellisObject,
  dependents: TrellisObject[],
): string {
  const warnBlock =
    dependents.length > 0
      ? `<div class="warn">
  <p>This issue is a prerequisite for:</p>
  <ul>
    ${dependents
      .map(
        (d) =>
          `<li><span class="id-chip">${escapeHtml(d.id)}</span> ${escapeHtml(d.title)}</li>`,
      )
      .join("\n    ")}
  </ul>
  <p>These dependencies will be removed automatically.</p>
</div>`
      : "";

  return `<div class="modal-overlay" role="dialog" aria-modal="true">
  <div class="modal-dialog">
    <h3>Delete &ldquo;${escapeHtml(obj.title)}&rdquo;?</h3>
    ${warnBlock}
    <p>This action cannot be undone.</p>
    <div class="modal-actions">
      <button class="btn-danger"
        hx-delete="/projects/${escapeHtml(key)}/issues/${escapeHtml(obj.id)}"
        hx-target="#detail"
        hx-swap="innerHTML">Confirm delete</button>
      <button type="button" onclick="document.getElementById('modal').innerHTML=''">Cancel</button>
    </div>
  </div>
</div>`;
}
