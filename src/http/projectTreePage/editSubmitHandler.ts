import type { IncomingMessage, ServerResponse } from "node:http";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  type TrellisObject,
} from "../../models";
import { appendObjectLog } from "../../services/local/appendObjectLog";
import { updateObject } from "../../services/local/updateObject";
import { escapeHtml } from "../escapeHtml";
import { readFormBody } from "../readFormBody";
import { makeRepo, SERVER_CONFIG } from "./makeRepo";
import { parsePrereqs } from "./parsePrereqs";
import { renderEditForm } from "./renderEditForm";
import { renderDetailView } from "./renderDetailView";

function parseEditFields(form: URLSearchParams, obj: TrellisObject) {
  return {
    title: form.get("title") ?? obj.title,
    status: (form.get("status") ?? obj.status) as TrellisObjectStatus,
    priority: (form.get("priority") ?? obj.priority) as TrellisObjectPriority,
    body: form.get("body") ?? "",
    prereqsRaw: form.get("prerequisites") ?? "",
    logEntry: form.get("log_entry") ?? "",
    externalIssueId: form.get("externalIssueId") ?? undefined,
  };
}

/** Handles PUT /projects/:key/issues/:id — validates prereqs and saves the edit. */
export async function editSubmitHandler(
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

  const form = await readFormBody(req);
  const {
    title,
    status,
    priority,
    body,
    prereqsRaw,
    logEntry,
    externalIssueId,
  } = parseEditFields(form, obj);
  const prereqs = parsePrereqs(prereqsRaw);

  for (const prereqId of prereqs) {
    const found = await repo.getObjectById(prereqId);
    if (!found) {
      res.writeHead(422, { "Content-Type": "text/html" });
      res.end(
        renderEditForm(
          key,
          id,
          {
            title,
            status,
            priority,
            body,
            prerequisites: prereqsRaw,
            log_entry: logEntry,
            externalIssueId,
            isTopLevel: obj.parent === null,
          },
          `Unknown prerequisite ID: ${escapeHtml(prereqId)}`,
        ),
      );
      return;
    }
  }

  await updateObject(
    repo,
    SERVER_CONFIG,
    id,
    title,
    priority,
    prereqs,
    body,
    status,
    true,
    externalIssueId,
  );

  if (logEntry.trim()) {
    await appendObjectLog(repo, id, logEntry.trim());
  }

  const updated = (await repo.getObjectById(id)) as TrellisObject;
  res.writeHead(200, {
    "Content-Type": "text/html",
    "HX-Trigger": "refreshTree",
  });
  res.end(await renderDetailView(key, updated, repo));
}
