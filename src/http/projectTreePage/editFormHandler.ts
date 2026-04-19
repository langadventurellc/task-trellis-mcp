import type { IncomingMessage, ServerResponse } from "node:http";
import { escapeHtml } from "../escapeHtml";
import { makeRepo } from "./makeRepo";
import { renderEditForm } from "./renderEditForm";

/** Handles GET /projects/:key/issues/:id/edit — returns the pre-populated edit form. */
export async function editFormHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { key, id } = params;
  const repo = makeRepo(key);
  const obj = await repo.getObjectById(id);

  if (!obj) {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(`<div><p>Not found: ${escapeHtml(id)}</p></div>`);
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(
    renderEditForm(key, id, {
      title: obj.title,
      status: obj.status,
      priority: obj.priority,
      body: obj.body,
      prerequisites: obj.prerequisites.join(", "),
    }),
  );
}
