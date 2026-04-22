import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { makeRepo } from "./makeRepo";

function send404(res: ServerResponse): void {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
}

/** Handles GET /projects/:key/issues/:id/file — streams the raw issue markdown file. */
export async function fileHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { key, id } = params;

  const projectRoot = join(resolveDataDir(), "projects", key);
  if (!existsSync(projectRoot)) {
    send404(res);
    return;
  }

  const repo = makeRepo(key);
  const filePath = await repo.getObjectFilePath(id);

  if (!filePath) {
    send404(res);
    return;
  }

  if (!filePath.startsWith(projectRoot)) {
    send404(res);
    return;
  }

  try {
    await stat(filePath);
  } catch {
    send404(res);
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("500 Internal Server Error");
    }
  });
  stream.pipe(res);
}
