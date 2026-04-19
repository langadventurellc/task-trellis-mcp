import { escapeHtml } from "../escapeHtml";
import { priorityRadios } from "./priorityRadios";
import { statusRadios } from "./statusRadios";

type EditFields = {
  title: string;
  status: string;
  priority: string;
  body: string;
  prerequisites: string;
  log_entry?: string;
};

/** Renders the data-view="edit" form fragment for an issue. */
export function renderEditForm(
  key: string,
  id: string,
  fields: EditFields,
  error?: string,
): string {
  const keyEsc = escapeHtml(key);
  const idEsc = escapeHtml(id);
  const errorBanner = error
    ? `<div class="error-banner" style="padding:10px 12px;margin-bottom:12px;border:1px solid var(--danger);background:var(--danger-tint);color:var(--danger);border-radius:6px;font-size:13px;">${escapeHtml(error)}</div>`
    : "";
  return `<div data-view="edit">
  ${errorBanner}
  <form class="form-card" hx-put="/projects/${keyEsc}/issues/${idEsc}" hx-target="#detail" hx-swap="innerHTML">
    <div class="form-header">
      <h2>Edit issue</h2>
      <span class="dim">${idEsc}</span>
    </div>
    <div class="form-grid">
      <div class="fld">
        <label for="f-title">Title</label>
        <input id="f-title" type="text" name="title" value="${escapeHtml(fields.title)}" required autofocus />
      </div>
      <div class="form-row">
        <div class="fld">
          <label>Status</label>
          <div class="seg">${statusRadios(fields.status, "s")}</div>
        </div>
        <div class="fld">
          <label>Priority</label>
          <div class="seg">${priorityRadios(fields.priority, "p")}</div>
        </div>
      </div>
      <div class="fld">
        <label for="f-body">Body</label>
        <textarea id="f-body" name="body">${escapeHtml(fields.body)}</textarea>
        <div class="hint">Markdown supported.</div>
      </div>
      <div class="fld">
        <label for="f-prereqs">Prerequisites</label>
        <input id="f-prereqs" type="text" name="prerequisites" value="${escapeHtml(fields.prerequisites)}" placeholder="Comma-separated issue IDs" />
        <div class="hint">Comma-separated list of prerequisite issue IDs.</div>
      </div>
      <div class="fld">
        <label for="f-log">Add log entry <span style="color:var(--text-subtle);font-weight:400;text-transform:none;letter-spacing:0;">(optional)</span></label>
        <input id="f-log" type="text" name="log_entry" value="${escapeHtml(fields.log_entry ?? "")}" placeholder="What changed?" />
      </div>
    </div>
    <div class="form-footer">
      <div class="left"></div>
      <div class="right">
        <button type="button" class="btn" hx-get="/projects/${keyEsc}/issues/${idEsc}/detail" hx-target="#detail" hx-swap="innerHTML">Cancel</button>
        <button type="submit" class="btn primary">Save changes</button>
      </div>
    </div>
  </form>
</div>`;
}
