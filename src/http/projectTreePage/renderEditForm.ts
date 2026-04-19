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
  const errorBanner = error ? `<div class="error-banner">${error}</div>` : "";
  return `<div data-view="edit">
  ${errorBanner}
  <form hx-put="/projects/${escapeHtml(key)}/issues/${escapeHtml(id)}" hx-target="#detail" hx-swap="innerHTML">
    <label>Title
      <input type="text" name="title" value="${escapeHtml(fields.title)}" required />
    </label>
    <fieldset>
      <legend>Status</legend>
      ${statusRadios(fields.status)}
    </fieldset>
    <fieldset>
      <legend>Priority</legend>
      ${priorityRadios(fields.priority)}
    </fieldset>
    <label>Body
      <textarea name="body">${escapeHtml(fields.body)}</textarea>
    </label>
    <label>Prerequisites (comma-separated IDs)
      <input type="text" name="prerequisites" value="${escapeHtml(fields.prerequisites)}" />
    </label>
    <label>Log entry
      <input type="text" name="log_entry" value="${escapeHtml(fields.log_entry ?? "")}" placeholder="Add log entry…" />
    </label>
    <button type="submit">Save</button>
    <button type="button" hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(id)}/detail" hx-target="#detail" hx-swap="innerHTML">Cancel</button>
  </form>
</div>`;
}
