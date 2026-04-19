import { TrellisObjectType, type TrellisObject } from "../../models";
import type { Repository } from "../../repositories/Repository";
import { escapeHtml } from "../escapeHtml";

function statusCssClass(status: string): string {
  if (status === "in-progress") return "progress";
  if (status === "wont-do") return "wontdo";
  return status;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    open: "Open",
    "in-progress": "In Progress",
    done: "Done",
    "wont-do": "Won't Do",
  };
  return labels[status] ?? status;
}

function priorityCssClass(priority: string): string {
  return priority === "medium" ? "med" : priority;
}

function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
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
        `<span class="sep"> / </span>`,
    )
    .join("");
  return `<nav class="breadcrumbs">${links}<span class="current">${escapeHtml(obj.title)}</span></nav>`;
}

async function buildPrerequisites(
  obj: TrellisObject,
  repo: Repository,
): Promise<string> {
  if (obj.prerequisites.length === 0) {
    return `<p class="empty-state">No prerequisites.</p>`;
  }
  const items = await Promise.all(
    obj.prerequisites.map(async (prereqId) => {
      const prereq = await repo.getObjectById(prereqId);
      const title = prereq ? escapeHtml(prereq.title) : escapeHtml(prereqId);
      const badge = prereq
        ? ` <span class="badge status-${escapeHtml(statusCssClass(prereq.status))}">${escapeHtml(statusLabel(prereq.status))}</span>`
        : "";
      return `<li><span class="id-chip">${escapeHtml(prereqId)}</span> ${title}${badge}</li>`;
    }),
  );
  return `<ul>${items.join("")}</ul>`;
}

/** Renders the detail pane HTML fragment for a Trellis object. */
export async function renderDetailView(
  key: string,
  obj: TrellisObject,
  repo: Repository,
): Promise<string> {
  const breadcrumbs = await buildBreadcrumbs(key, obj, repo);

  const addChildHidden =
    obj.type === TrellisObjectType.TASK ? ` style="display:none"` : "";
  const titleRow = `<div class="title-row">
  <h2>${escapeHtml(obj.title)}</h2>
  <button hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(obj.id)}/edit" hx-target="#detail" hx-swap="innerHTML">Edit</button>
  <button${addChildHidden} hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(obj.id)}/children/new" hx-target="#detail" hx-swap="innerHTML">Add child</button>
  <button hx-get="/projects/${escapeHtml(key)}/issues/${escapeHtml(obj.id)}/delete" hx-target="#modal" hx-swap="innerHTML">Delete</button>
</div>`;

  const badgesRow = `<div class="badges-row">
  <span class="badge type-${escapeHtml(obj.type)}">${escapeHtml(typeLabel(obj.type))}</span>
  <span class="badge status-${escapeHtml(statusCssClass(obj.status))}">${escapeHtml(statusLabel(obj.status))}</span>
  <span class="badge priority-${escapeHtml(priorityCssClass(obj.priority))}">${escapeHtml(priorityCssClass(obj.priority))}</span>
  <span class="id-chip">${escapeHtml(obj.id)}</span>
</div>`;

  const description = obj.body
    ? `<div class="prose">${escapeHtml(obj.body)}</div>`
    : `<div class="prose"><p class="empty-state">No description.</p></div>`;

  const prerequisites = await buildPrerequisites(obj, repo);

  const log =
    obj.log.length > 0
      ? `<ul>${obj.log.map((entry) => `<li class="entry">${escapeHtml(entry)}</li>`).join("")}</ul>`
      : `<p class="empty-state">No log entries.</p>`;

  let filesList = `<p class="empty-state">No modified files.</p>`;
  if (obj.affectedFiles instanceof Map && obj.affectedFiles.size > 0) {
    filesList = `<ul>${[...obj.affectedFiles.entries()]
      .map(
        ([filePath, desc]) =>
          `<li><span class="file-path">${escapeHtml(filePath)}</span> <span class="file-desc">${escapeHtml(desc)}</span></li>`,
      )
      .join("")}</ul>`;
  }

  return `<div data-view="view">
  ${breadcrumbs}
  ${titleRow}
  ${badgesRow}
  <section class="description">${description}</section>
  <section class="prerequisites">
    <h3>Prerequisites</h3>
    ${prerequisites}
  </section>
  <section class="log">
    <h3>Log</h3>
    ${log}
  </section>
  <section class="modified-files">
    <h3>Modified Files</h3>
    ${filesList}
  </section>
</div>`;
}
