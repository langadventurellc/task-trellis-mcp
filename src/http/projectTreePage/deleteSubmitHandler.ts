import type { IncomingMessage, ServerResponse } from "node:http";
import { escapeHtml } from "../escapeHtml";
import { makeRepo } from "./makeRepo";

/** Handles DELETE /projects/:key/issues/:id — sweeps reverse prereqs, deletes issue, clears detail pane. */
export async function deleteSubmitHandler(
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

  const allObjects = await repo.getObjects(true);
  for (const dependent of allObjects) {
    if (dependent.prerequisites.includes(id)) {
      await repo.saveObject({
        ...dependent,
        prerequisites: dependent.prerequisites.filter((p) => p !== id),
      });
    }
  }

  await repo.deleteObject(id, true);

  res.writeHead(200, {
    "Content-Type": "text/html",
    "HX-Trigger": "refreshTree",
  });
  res.end('<div id="modal" hx-swap-oob="true"></div>');
}
