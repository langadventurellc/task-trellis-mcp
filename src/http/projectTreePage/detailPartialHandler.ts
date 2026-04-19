import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { LocalRepository } from "../../repositories/local/LocalRepository";
import { escapeHtml } from "../escapeHtml";
import { renderDetail } from "./renderDetail";

function makeRepo(key: string): LocalRepository {
  return new LocalRepository({
    mode: "local",
    planningRootFolder: join(resolveDataDir(), "projects", key) + "/",
    autoCompleteParent: false,
    autoPrune: 0,
  });
}

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
