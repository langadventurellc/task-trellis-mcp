import { existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { TrellisObjectStatus } from "../../models";
import type { TrellisObject } from "../../models";
import { appShell } from "../appShell";
import { escapeHtml } from "../escapeHtml";
import { makeRepo } from "./makeRepo";
import { renderTreeFragment } from "./renderTreeFragment";

function metaBar(objects: TrellisObject[]): string {
  const total = objects.length;
  const open = objects.filter(
    (o) => o.status === TrellisObjectStatus.OPEN,
  ).length;
  const inProgress = objects.filter(
    (o) => o.status === TrellisObjectStatus.IN_PROGRESS,
  ).length;
  const done = objects.filter(
    (o) => o.status === TrellisObjectStatus.DONE,
  ).length;
  return `${total} issues · ${open} open · ${inProgress} in-progress · ${done} done`;
}

/** Handles GET /projects/:key — full project page with sidebar tree, meta counts, and empty detail pane. */
export async function projectTreeHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { key } = params;

  if (!existsSync(join(resolveDataDir(), "projects", key))) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
    return;
  }

  const repo = makeRepo(key);
  const allObjects = await repo.getObjects(true);
  const treeHtml = renderTreeFragment(key, allObjects);

  const sidebar = `<aside class="sidebar">
  <header class="brand"><a href="/">Task Trellis</a></header>
  <input
    type="text"
    name="q"
    placeholder="Search issues\u2026"
    hx-get="/projects/${escapeHtml(key)}/issues/search"
    hx-target="#issue-tree"
    hx-trigger="keyup changed delay:200ms"
    hx-params="q"
  >
  <p class="meta">${metaBar(allObjects)}</p>
  <div
    id="issue-tree"
    hx-trigger="refreshTree from:body"
    hx-get="/projects/${escapeHtml(key)}/issues/search"
    hx-swap="innerHTML"
  >
    ${treeHtml}
  </div>
</aside>`;

  const body = `<div id="modal"></div>
<div class="app-layout">
  ${sidebar}
  <main class="detail-pane">
    <div id="detail"></div>
  </main>
</div>`;

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(appShell(`Task Trellis \u2014 ${key}`, body));
}
