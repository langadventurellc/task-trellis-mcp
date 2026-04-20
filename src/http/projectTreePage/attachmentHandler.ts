import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join } from "node:path";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { makeRepo } from "./makeRepo";

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css",
  ".csv": "text/csv",
  ".gif": "image/gif",
  ".html": "text/html",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".md": "text/plain",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".zip": "application/zip",
};

function mimeType(filename: string): string {
  return (
    MIME_TYPES[extname(filename).toLowerCase()] ?? "application/octet-stream"
  );
}

function send404(res: ServerResponse): void {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
}

function serveFile(
  filePath: string,
  filename: string,
  res: ServerResponse,
): void {
  res.writeHead(200, { "Content-Type": mimeType(filename) });
  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("500 Internal Server Error");
    }
  });
  stream.pipe(res);
}

/** Handles GET /projects/:key/issues/:id/attachments/:filename */
export async function attachmentHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { key, id, filename } = params;

  if (filename.includes("/") || filename.includes("..")) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("400 Bad Request");
    return;
  }

  if (!existsSync(join(resolveDataDir(), "projects", key))) {
    send404(res);
    return;
  }

  const repo = makeRepo(key);
  const obj = await repo.getObjectById(id);

  if (!obj) {
    send404(res);
    return;
  }

  const folder = await repo.getAttachmentsFolder(obj);
  const filePath = join(folder, filename);

  try {
    await stat(filePath);
  } catch {
    send404(res);
    return;
  }

  serveFile(filePath, filename, res);
}
