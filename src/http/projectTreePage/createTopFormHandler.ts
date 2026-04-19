import type { IncomingMessage, ServerResponse } from "node:http";
import { renderCreateTopForm } from "./renderCreateTopForm";

/** Handles GET /projects/:key/issues/new — returns the top-level create form with type picker. */
export function createTopFormHandler(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): void {
  const { key } = params;
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(renderCreateTopForm(key));
}
