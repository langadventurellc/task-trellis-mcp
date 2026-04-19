import { existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { LocalRepository } from "../../repositories/local/LocalRepository";
import { escapeHtml } from "../escapeHtml";
import { page } from "../layout";
import { treeNode } from "./treeNode";

function makeRepo(key: string): LocalRepository {
  return new LocalRepository({
    mode: "local",
    planningRootFolder: join(resolveDataDir(), "projects", key) + "/",
    autoCompleteParent: false,
    autoPrune: 0,
  });
}

/** Handles GET /projects/:key — full project tree page. */
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
  const allObjects = await repo.getObjects(false);
  const roots = allObjects.filter((o) => o.parent === null);
  const treeHtml = roots.map((o) => treeNode(key, o)).join("\n");

  const body = `<div style="display:flex;gap:16px">
  <div style="flex:1">
    <h1>Task Trellis &#8212; ${escapeHtml(key)}</h1>
    <div class="tree">
      ${treeHtml || "<p>No open issues found.</p>"}
    </div>
  </div>
  <div id="detail-pane" style="flex:1;border-left:1px solid #ccc;padding-left:16px"></div>
</div>`;

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(page(`Task Trellis — ${key}`, body));
}
