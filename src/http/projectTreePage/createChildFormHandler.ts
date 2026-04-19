import type { IncomingMessage, ServerResponse } from "node:http";
import { escapeHtml } from "../escapeHtml";
import { deriveChildType } from "./deriveChildType";
import { makeRepo } from "./makeRepo";
import { renderCreateChildForm } from "./renderCreateChildForm";

/** Handles GET /projects/:key/issues/:id/children/new — returns the typed create form. */
export async function createChildFormHandler(
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

  const childType = deriveChildType(obj.type);
  if (!childType) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`<div><p>Tasks cannot have children.</p></div>`);
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(renderCreateChildForm(key, id, childType));
}
