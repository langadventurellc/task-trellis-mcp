import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { escapeHtml } from "../escapeHtml";
import { priorityRadios } from "./priorityRadios";
import { statusRadios } from "./statusRadios";
import { typeLabel } from "./typeLabel";

type CreateChildFields = {
  title?: string;
  status?: string;
  priority?: string;
  body?: string;
  prerequisites?: string;
};

/** Renders the data-view="create" form fragment for a new child issue. */
export function renderCreateChildForm(
  key: string,
  parentId: string,
  childType: TrellisObjectType,
  fields: CreateChildFields = {},
  error?: string,
): string {
  const keyEsc = escapeHtml(key);
  const parentEsc = escapeHtml(parentId);
  const errorBanner = error
    ? `<div class="error-banner" style="padding:10px 12px;margin-bottom:12px;border:1px solid var(--danger);background:var(--danger-tint);color:var(--danger);border-radius:6px;font-size:13px;">${escapeHtml(error)}</div>`
    : "";
  const status = fields.status ?? TrellisObjectStatus.DRAFT;
  const priority = fields.priority ?? TrellisObjectPriority.MEDIUM;
  const label = typeLabel(childType);
  return `<div data-view="create">
  ${errorBanner}
  <form class="form-card" hx-post="/projects/${keyEsc}/issues/${parentEsc}/children" hx-target="#detail" hx-swap="innerHTML">
    <div class="form-header">
      <h2>New child issue</h2>
      <span class="dim">under ${parentEsc} · creates <strong style="color:var(--text-muted);">${escapeHtml(label)}</strong></span>
    </div>
    <div class="form-grid">
      <div class="fld">
        <label for="c-title">Title</label>
        <input id="c-title" type="text" name="title" value="${escapeHtml(fields.title ?? "")}" required autofocus />
      </div>
      <div class="form-row">
        <div class="fld">
          <label>Status</label>
          <div class="seg">${statusRadios(status, "cs")}</div>
        </div>
        <div class="fld">
          <label>Priority</label>
          <div class="seg">${priorityRadios(priority, "cp")}</div>
        </div>
      </div>
      <div class="fld">
        <label for="c-body">Body</label>
        <textarea id="c-body" name="body" placeholder="Describe the scope, acceptance criteria, links\u2026">${escapeHtml(fields.body ?? "")}</textarea>
      </div>
      <div class="fld">
        <label for="c-prereqs">Prerequisites</label>
        <input id="c-prereqs" type="text" name="prerequisites" value="${escapeHtml(fields.prerequisites ?? "")}" placeholder="Comma-separated issue IDs (optional)" />
      </div>
    </div>
    <div class="form-footer">
      <div class="left"></div>
      <div class="right">
        <button type="button" class="btn" hx-get="/projects/${keyEsc}/issues/${parentEsc}/detail" hx-target="#detail" hx-swap="innerHTML">Cancel</button>
        <button type="submit" class="btn primary"><svg><use href="#i-plus"/></svg> Create child</button>
      </div>
    </div>
  </form>
</div>`;
}
