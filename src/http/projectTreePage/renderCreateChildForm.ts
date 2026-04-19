import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { escapeHtml } from "../escapeHtml";
import { priorityRadios } from "./priorityRadios";
import { statusRadios } from "./statusRadios";

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
  const errorBanner = error ? `<div class="error-banner">${error}</div>` : "";
  const status = fields.status ?? TrellisObjectStatus.DRAFT;
  const priority = fields.priority ?? TrellisObjectPriority.MEDIUM;
  const typeLabel = childType.charAt(0).toUpperCase() + childType.slice(1);
  return `<div data-view="create">
  ${errorBanner}
  <p>Creating: <span class="badge type-${escapeHtml(childType)}">${escapeHtml(typeLabel)}</span></p>
  <form hx-post="/projects/${escapeHtml(key)}/issues/${escapeHtml(parentId)}/children" hx-target="#detail" hx-swap="innerHTML">
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
    <button type="button" hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(parentId)}/detail" hx-target="#detail" hx-swap="innerHTML">Cancel</button>
  </form>
</div>`;
}
