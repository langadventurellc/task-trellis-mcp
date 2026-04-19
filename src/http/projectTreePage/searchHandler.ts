import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import type { TrellisObject } from "../../models";
import { renderFlatFragment } from "./renderFlatFragment";
import { makeRepo } from "./makeRepo";
import { renderTreeFragment } from "./renderTreeFragment";

function matchesQuery(obj: TrellisObject, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    obj.id.toLowerCase().includes(lower) ||
    obj.title.toLowerCase().includes(lower) ||
    obj.body.toLowerCase().includes(lower)
  );
}

/** Handles GET /projects/:key/issues/search?q=… — returns filtered or full tree HTML fragment. */
export async function searchHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { key } = params;
  const url = new URL(req.url ?? "/", "http://localhost");
  const q = url.searchParams.get("q") ?? "";

  const repo = makeRepo(key);
  const allObjects = await repo.getObjects(true);

  const html = q
    ? renderFlatFragment(
        key,
        allObjects.filter((o) => matchesQuery(o, q)),
      )
    : renderTreeFragment(key, allObjects);

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
}
