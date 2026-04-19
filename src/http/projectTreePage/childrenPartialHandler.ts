import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { LocalRepository } from "../../repositories/local/LocalRepository";
import { treeNode } from "./treeNode";

function makeRepo(key: string): LocalRepository {
  return new LocalRepository({
    mode: "local",
    planningRootFolder: join(resolveDataDir(), "projects", key) + "/",
    autoCompleteParent: false,
    autoPrune: 0,
  });
}

/** Handles GET /projects/:key/issues/:id/children — HTMX partial for child nodes. */
export async function childrenPartialHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { key, id } = params;
  const repo = makeRepo(key);
  const children = await repo.getChildrenOf(id, false);

  if (children.length === 0) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<div></div>");
    return;
  }

  const html = children.map((o) => treeNode(key, o)).join("\n");
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
}
