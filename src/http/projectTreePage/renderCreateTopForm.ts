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
    .map(
      ([value, label]) =>
        `<label><input type="radio" name="type" value="${value}"${selected === value ? " checked" : ""} required /> ${label}</label>`,
    )
    .join("\n");
}

/** Renders the data-view="create" form fragment for a new top-level issue. */
export function renderCreateTopForm(
  key: string,
  fields: CreateTopFields = {},
  error?: string,
): string {
  const errorBanner = error ? `<div class="error-banner">${error}</div>` : "";
  const status = fields.status ?? TrellisObjectStatus.DRAFT;
  const priority = fields.priority ?? TrellisObjectPriority.MEDIUM;
  return `<div data-view="create">
  ${errorBanner}
  <form hx-post="/projects/${escapeHtml(key)}/issues" hx-target="#detail" hx-swap="innerHTML">
    <fieldset>
      <legend>Type</legend>
      ${typeRadios(fields.type ?? "")}
    </fieldset>
    <label>Title
      <input type="text" name="title" value="${escapeHtml(fields.title ?? "")}" required />
    </label>
    <fieldset>
      <legend>Status</legend>
      ${statusRadios(status)}
    </fieldset>
    <fieldset>
      <legend>Priority</legend>
      ${priorityRadios(priority)}
    </fieldset>
    <label>Body
      <textarea name="body">${escapeHtml(fields.body ?? "")}</textarea>
    </label>
    <label>Prerequisites (comma-separated IDs)
      <input type="text" name="prerequisites" value="${escapeHtml(fields.prerequisites ?? "")}" />
    </label>
    <button type="submit">Create</button>
  </form>
</div>`;
}
