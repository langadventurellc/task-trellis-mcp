import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import type { TrellisObject } from "../../models";
import { makeRepo } from "./makeRepo";
import { metaBar } from "./metaBar";
import { renderFlatFragment } from "./renderFlatFragment";
import { renderTreeFragment } from "./renderTreeFragment";

function matchesQuery(obj: TrellisObject, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    obj.id.toLowerCase().includes(lower) ||
    obj.title.toLowerCase().includes(lower) ||
    obj.body.toLowerCase().includes(lower)
  );
}

/** Handles GET /projects/:key/issues/search?q=… — returns filtered or full tree + OOB meta. */
export async function searchHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { key } = params;
  const url = new URL(req.url ?? "/", "http://localhost");
  const q = url.searchParams.get("q") ?? "";
  const hideDone = url.searchParams.get("hideDone");
  const openParam = url.searchParams.get("open");

  const repo = makeRepo(key);
  const allObjects = await repo.getObjects(true);

  let tree: string;
  if (q) {
    tree = renderFlatFragment(
      key,
      allObjects.filter((o) => matchesQuery(o, q)),
    );
  } else {
    const openSet =
      openParam !== null
        ? new Set(openParam.split(",").filter(Boolean))
        : undefined;
    tree = renderTreeFragment(key, allObjects, {
      hideCompleted: hideDone === "1",
      ...(openSet ? { openSet } : {}),
    });
  }

  const metaOob = `<div class="tree-meta" id="tree-meta" hx-swap-oob="true">${metaBar(allObjects)}</div>`;

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`${tree}\n${metaOob}`);
}
