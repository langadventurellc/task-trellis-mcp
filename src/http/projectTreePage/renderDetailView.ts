import { TrellisObjectType, type TrellisObject } from "../../models";
import type { Repository } from "../../repositories/Repository";
import { escapeHtml } from "../escapeHtml";
import { priorityCssClass } from "./priorityCssClass";
import { statusCssClass } from "./statusCssClass";
import { STATUS_LABELS } from "./statusLabels";
import { typeLabel } from "./typeLabel";

function statusLabel(status: string): string {
  return STATUS_LABELS.find(([v]) => v === status)?.[1] ?? status;
}

function priorityLabel(priority: string): string {
  if (priority === "high") return "High priority";
  if (priority === "medium") return "Medium priority";
  if (priority === "low") return "Low priority";
  return priority;
}

async function buildBreadcrumbs(
  key: string,
  obj: TrellisObject,
  repo: Repository,
): Promise<string> {
  const crumbs: Array<{ id: string; title: string }> = [];
  let parentId = obj.parent;
  while (parentId) {
    const ancestor = await repo.getObjectById(parentId);
    if (!ancestor) break;
    crumbs.unshift({ id: ancestor.id, title: ancestor.title });
    parentId = ancestor.parent;
  }
  const links = crumbs
    .map(
      (c) =>
        `<a hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(c.id)}/detail" hx-target="#detail" hx-swap="innerHTML">${escapeHtml(c.title)}</a>` +
        `<span class="sep">\u203A</span>`,
    )
    .join("");
  return `<div class="crumbs">${links}<span class="current">${escapeHtml(obj.title)}</span></div>`;
}

async function buildPrerequisites(
  obj: TrellisObject,
  repo: Repository,
): Promise<string> {
  if (obj.prerequisites.length === 0) {
    return `<p class="empty">No prerequisites.</p>`;
  }
  const items = await Promise.all(
    obj.prerequisites.map(async (prereqId) => {
      const prereq = await repo.getObjectById(prereqId);
      const sdotClass = prereq ? statusCssClass(prereq.status) : "draft";
      const name = prereq ? escapeHtml(prereq.title) : "";
      const badge = prereq
        ? `<span class="badge status-${escapeHtml(statusCssClass(prereq.status))}" style="margin-left:auto;"><span class="mini-dot"></span>${escapeHtml(statusLabel(prereq.status))}</span>`
        : "";
      return `<li><span class="sdot ${escapeHtml(sdotClass)}"></span><span class="id">${escapeHtml(prereqId)}</span><span class="name">${name}</span>${badge}</li>`;
    }),
  );
  return `<ul class="prereq-list">${items.join("")}</ul>`;
}

/** Renders the detail pane HTML fragment for a Trellis object. */
export async function renderDetailView(
  key: string,
  obj: TrellisObject,
  repo: Repository,
  attachments: string[] = [],
): Promise<string> {
  const [breadcrumbs, prerequisites] = await Promise.all([
    buildBreadcrumbs(key, obj, repo),
    buildPrerequisites(obj, repo),
  ]);

  const keyEsc = escapeHtml(key);
  const idEsc = escapeHtml(obj.id);

  const addChildHidden =
    obj.type === TrellisObjectType.TASK ? ` style="display:none"` : "";
  const titleRow = `<div class="title-row">
  <h1 class="title">${escapeHtml(obj.title)}</h1>
  <div class="actions">
    <button class="btn" type="button"
      hx-get="/projects/${keyEsc}/issues/${idEsc}/edit" hx-target="#detail" hx-swap="innerHTML">
      <svg><use href="#i-edit"/></svg> Edit
    </button>
    <button class="btn" type="button"${addChildHidden}
      hx-get="/projects/${keyEsc}/issues/${idEsc}/children/new" hx-target="#detail" hx-swap="innerHTML">
      <svg><use href="#i-plus"/></svg> Add child
    </button>
    <button class="btn danger" type="button"
      hx-get="/projects/${keyEsc}/issues/${idEsc}/delete" hx-target="#modal" hx-swap="innerHTML">
      <svg><use href="#i-trash"/></svg> Delete
    </button>
  </div>
</div>`;

  const statusClass = statusCssClass(obj.status);
  const priorityClass = priorityCssClass(obj.priority);
  const badgesRow = `<div class="badges">
  <span class="badge kind">${escapeHtml(typeLabel(obj.type))}</span>
  <span class="badge status-${escapeHtml(statusClass)}"><span class="mini-dot"></span>${escapeHtml(statusLabel(obj.status))}</span>
  <span class="badge priority ${escapeHtml(priorityClass)}">${escapeHtml(priorityLabel(obj.priority))}</span>
  <span class="id-chip">${idEsc}</span>
</div>`;

  const description = obj.body
    ? `<div class="prose">${escapeHtml(obj.body)}</div>`
    : `<p class="empty">No description.</p>`;

  const log =
    obj.log.length > 0
      ? `<ul class="log-list">${obj.log
          .map(
            (entry) =>
              `<li><span class="entry">${escapeHtml(entry)}</span></li>`,
          )
          .join("")}</ul>`
      : `<p class="empty">No log entries.</p>`;

  let filesList = `<p class="empty">No modified files.</p>`;
  if (obj.affectedFiles instanceof Map && obj.affectedFiles.size > 0) {
    filesList = `<ul class="prereq-list">${[...obj.affectedFiles.entries()]
      .map(
        ([filePath, desc]) =>
          `<li><span class="id">${escapeHtml(filePath)}</span><span class="name">${escapeHtml(desc)}</span></li>`,
      )
      .join("")}</ul>`;
  }

  const attachmentsList =
    attachments.length > 0
      ? `<div class="field-group">
    <div class="field-label">Attachments</div>
    <ul class="prereq-list">${attachments
      .map(
        (name) =>
          `<li><a href="/projects/${keyEsc}/issues/${idEsc}/attachments/${encodeURIComponent(name)}">${escapeHtml(name)}</a></li>`,
      )
      .join("")}</ul>
  </div>`
      : "";

  return `<div data-view="view">
  ${breadcrumbs}
  ${titleRow}
  ${badgesRow}
  <div class="field-group">
    <div class="field-label">Description</div>
    ${description}
  </div>
  ${attachmentsList}
  <div class="field-group">
    <div class="field-label">Prerequisites</div>
    ${prerequisites}
  </div>
  <div class="field-group">
    <div class="field-label">Log</div>
    ${log}
  </div>
  <div class="field-group">
    <div class="field-label">Modified files</div>
    ${filesList}
  </div>
</div>`;
}
