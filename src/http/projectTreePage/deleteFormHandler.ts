import type { IncomingMessage, ServerResponse } from "node:http";
import type { TrellisObject } from "../../models";
import { isRequiredForOtherObjects } from "../../utils/isRequiredForOtherObjects";
import { escapeHtml } from "../escapeHtml";
import { makeRepo } from "./makeRepo";
import { renderDeleteModal } from "./renderDeleteModal";

/** Handles GET /projects/:key/issues/:id/delete — returns delete-confirm modal fragment. */
export async function deleteFormHandler(
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

  const hasDependents = await isRequiredForOtherObjects(obj, repo);
  let dependents: TrellisObject[] = [];
  if (hasDependents) {
    const allObjects = await repo.getObjects(true);
    dependents = allObjects.filter((o) => o.prerequisites.includes(id));
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(renderDeleteModal(key, obj, dependents));
}
