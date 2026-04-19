import type { IncomingMessage, ServerResponse } from "node:http";
import { escapeHtml } from "../escapeHtml";
import { makeRepo } from "./makeRepo";
import { renderDetail } from "./renderDetail";

/** Handles GET /projects/:key/issues/:id/detail — HTMX partial for detail pane. */
export async function detailPartialHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { key, id } = params;
  const repo = makeRepo(key);
  const obj = await repo.getObjectById(id);

  if (!obj) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<div><p>Not found: ${escapeHtml(id)}</p></div>`);
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(renderDetail(key, obj));
}
