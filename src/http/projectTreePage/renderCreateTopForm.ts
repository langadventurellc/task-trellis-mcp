import { TrellisObjectPriority, TrellisObjectStatus } from "../../models";
import { escapeHtml } from "../escapeHtml";
import { priorityRadios } from "./priorityRadios";
import { statusRadios } from "./statusRadios";

type CreateTopFields = {
  title?: string;
  type?: string;
  status?: string;
  priority?: string;
  body?: string;
  prerequisites?: string;
};

function typeRadios(selected: string): string {
  return [
    ["project", "Project"],
    ["epic", "Epic"],
    ["feature", "Feature"],
    ["task", "Task"],
  ]
    .map(([value, label]) => {
      const id = `t-${value}`;
      const checked = selected === value ? " checked" : "";
      return `<input type="radio" id="${id}" name="type" value="${value}"${checked} required><label for="${id}">${label}</label>`;
    })
    .join("");
}

/** Renders the data-view="create" form fragment for a new top-level issue. */
export function renderCreateTopForm(
  key: string,
  fields: CreateTopFields = {},
  error?: string,
): string {
  const keyEsc = escapeHtml(key);
  const errorBanner = error
    ? `<div class="error-banner" style="padding:10px 12px;margin-bottom:12px;border:1px solid var(--danger);background:var(--danger-tint);color:var(--danger);border-radius:6px;font-size:13px;">${escapeHtml(error)}</div>`
    : "";
  const status = fields.status ?? TrellisObjectStatus.DRAFT;
  const priority = fields.priority ?? TrellisObjectPriority.MEDIUM;
  return `<div data-view="create">
  ${errorBanner}
  <form class="form-card" hx-post="/projects/${keyEsc}/issues" hx-target="#detail" hx-swap="innerHTML">
    <div class="form-header">
      <h2>New top-level issue</h2>
      <span class="dim">${keyEsc}</span>
    </div>
    <div class="form-grid">
      <div class="fld">
        <label>Type</label>
        <div class="seg">${typeRadios(fields.type ?? "")}</div>
      </div>
      <div class="fld">
        <label for="top-title">Title</label>
        <input id="top-title" type="text" name="title" value="${escapeHtml(fields.title ?? "")}" required autofocus />
      </div>
      <div class="form-row">
        <div class="fld">
          <label>Status</label>
          <div class="seg">${statusRadios(status, "ts")}</div>
        </div>
        <div class="fld">
          <label>Priority</label>
          <div class="seg">${priorityRadios(priority, "tp")}</div>
        </div>
      </div>
      <div class="fld">
        <label for="top-body">Body</label>
        <textarea id="top-body" name="body">${escapeHtml(fields.body ?? "")}</textarea>
      </div>
      <div class="fld">
        <label for="top-prereqs">Prerequisites</label>
        <input id="top-prereqs" type="text" name="prerequisites" value="${escapeHtml(fields.prerequisites ?? "")}" placeholder="Comma-separated issue IDs (optional)" />
      </div>
    </div>
    <div class="form-footer">
      <div class="left"></div>
      <div class="right">
        <button type="submit" class="btn primary"><svg><use href="#i-plus"/></svg> Create issue</button>
      </div>
    </div>
  </form>
</div>`;
}
