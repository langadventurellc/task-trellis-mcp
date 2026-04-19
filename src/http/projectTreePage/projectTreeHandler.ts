import { existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { appShell } from "../appShell";
import { escapeHtml } from "../escapeHtml";
import { makeRepo } from "./makeRepo";
import { metaBar } from "./metaBar";
import { renderTreeFragment } from "./renderTreeFragment";

/** Handles GET /projects/:key — full app shell with sidebar tree, meta counts, and empty detail pane. */
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
  const keyEsc = escapeHtml(key);

  const sidebar = `<aside class="sidebar">
  <div class="sidebar-header">
    <div class="brand">
      <div class="brand-mark">TT</div>
      <div>
        <div class="brand-name"><a href="/" style="text-decoration:none;color:inherit;">Task Trellis</a></div>
        <div class="brand-repo">${keyEsc}</div>
      </div>
    </div>
    <div style="display:flex;gap:2px;">
      <button class="icon-btn" id="theme-toggle" title="Toggle dark mode" aria-label="Toggle dark mode" type="button">
        <svg class="theme-icon-light"><use href="#i-moon"/></svg>
        <svg class="theme-icon-dark"><use href="#i-sun"/></svg>
      </button>
      <button class="icon-btn" title="New top-level issue" type="button"
        hx-get="/projects/${keyEsc}/issues/new" hx-target="#detail" hx-swap="innerHTML">
        <svg><use href="#i-plus"/></svg>
      </button>
    </div>
  </div>

  <div class="search">
    <svg><use href="#i-search"/></svg>
    <input type="text" name="q" placeholder="Search issues\u2026"
      hx-get="/projects/${keyEsc}/issues/search"
      hx-target="#issue-tree"
      hx-trigger="keyup changed delay:200ms"
      hx-params="q" />
  </div>

  <div class="tree-meta" id="tree-meta">${metaBar(allObjects)}</div>

  <nav class="tree"
    id="issue-tree"
    hx-trigger="refreshTree from:body"
    hx-get="/projects/${keyEsc}/issues/search"
    hx-swap="innerHTML">
    ${treeHtml}
  </nav>
</aside>`;

  const body = `<div class="app">
  ${sidebar}
  <main class="main">
    <div class="detail" id="detail"></div>
    <div id="modal"></div>
  </main>
</div>`;

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(appShell(`Task Trellis \u2014 ${key}`, body));
}
