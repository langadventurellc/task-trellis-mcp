import type { IncomingMessage, ServerResponse } from "node:http";
import { TrellisObjectPriority, TrellisObjectStatus } from "../../models";
import type { Repository } from "../../repositories/Repository";
import { createObject } from "../../services/local/createObject";
import { escapeHtml } from "../escapeHtml";
import { readFormBody } from "../readFormBody";
import { deriveChildType } from "./deriveChildType";
import { makeRepo } from "./makeRepo";
import { parsePrereqs } from "./parsePrereqs";
import { renderCreateChildForm } from "./renderCreateChildForm";
import { renderDetailView } from "./renderDetailView";

function parseCreateChildFields(form: URLSearchParams) {
  return {
    title: form.get("title") ?? "",
    status: (form.get("status") ??
      TrellisObjectStatus.DRAFT) as TrellisObjectStatus,
    priority: (form.get("priority") ??
      TrellisObjectPriority.MEDIUM) as TrellisObjectPriority,
    body: form.get("body") ?? "",
    prereqsRaw: form.get("prerequisites") ?? "",
  };
}

async function resolveCreatedObj(
  repo: Repository,
  resultText: string,
  fallbackId: string,
) {
  const prefix = "Created object with ID: ";
  const newId = resultText.startsWith(prefix)
    ? resultText.slice(prefix.length).trim()
    : null;
  return (
    (newId ? await repo.getObjectById(newId) : null) ??
    (await repo.getObjectById(fallbackId))
  );
}

/** Handles POST /projects/:key/issues/:id/children — creates the child and returns its detail. */
export async function createChildSubmitHandler(
  req: IncomingMessage,
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

  const childType = deriveChildType(obj.type);
  if (!childType) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`<div><p>Tasks cannot have children.</p></div>`);
    return;
  }

  const form = await readFormBody(req);
  const { title, status, priority, body, prereqsRaw } =
    parseCreateChildFields(form);
  const prereqs = parsePrereqs(prereqsRaw);

  for (const prereqId of prereqs) {
    const found = await repo.getObjectById(prereqId);
    if (!found) {
      res.writeHead(422, { "Content-Type": "text/html" });
      res.end(
        renderCreateChildForm(
          key,
          id,
          childType,
          { title, status, priority, body, prerequisites: prereqsRaw },
          `Unknown prerequisite ID: ${escapeHtml(prereqId)}`,
        ),
      );
      return;
    }
  }

  const result = await createObject(
    repo,
    childType,
    title,
    id,
    priority,
    status,
    prereqs,
    body,
  );
  const toRender = await resolveCreatedObj(
    repo,
    result.content[0]?.text ?? "",
    id,
  );
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(await renderDetailView(key, toRender!, repo));
}
