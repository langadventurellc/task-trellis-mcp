import type { IncomingMessage, ServerResponse } from "node:http";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import type { Repository } from "../../repositories/Repository";
import { createObject } from "../../services/local/createObject";
import { escapeHtml } from "../escapeHtml";
import { readFormBody } from "../readFormBody";
import { makeRepo } from "./makeRepo";
import { parsePrereqs } from "./parsePrereqs";
import { renderCreateTopForm } from "./renderCreateTopForm";
import { renderDetailView } from "./renderDetailView";

const VALID_TYPES = new Set<string>(Object.values(TrellisObjectType));

function parseCreateTopFields(form: URLSearchParams) {
  return {
    rawType: form.get("type") ?? "",
    title: form.get("title") ?? "",
    status: (form.get("status") ??
      TrellisObjectStatus.DRAFT) as TrellisObjectStatus,
    priority: (form.get("priority") ??
      TrellisObjectPriority.MEDIUM) as TrellisObjectPriority,
    body: form.get("body") ?? "",
    prereqsRaw: form.get("prerequisites") ?? "",
  };
}

async function resolveCreatedObj(repo: Repository, resultText: string) {
  const prefix = "Created object with ID: ";
  if (!resultText.startsWith(prefix)) return null;
  const newId = resultText.slice(prefix.length).trim();
  return repo.getObjectById(newId);
}

/** Handles POST /projects/:key/issues — creates a top-level object and returns its detail. */
export async function createTopSubmitHandler(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { key } = params;
  const repo = makeRepo(key);
  const form = await readFormBody(req);
  const { rawType, title, status, priority, body, prereqsRaw } =
    parseCreateTopFields(form);

  if (!VALID_TYPES.has(rawType)) {
    res.writeHead(422, { "Content-Type": "text/html" });
    res.end(
      renderCreateTopForm(
        key,
        {
          type: rawType,
          title,
          status,
          priority,
          body,
          prerequisites: prereqsRaw,
        },
        "Please select a valid type.",
      ),
    );
    return;
  }

  const type = rawType as TrellisObjectType;
  const prereqs = parsePrereqs(prereqsRaw);

  for (const prereqId of prereqs) {
    const found = await repo.getObjectById(prereqId);
    if (!found) {
      res.writeHead(422, { "Content-Type": "text/html" });
      res.end(
        renderCreateTopForm(
          key,
          { type, title, status, priority, body, prerequisites: prereqsRaw },
          `Unknown prerequisite ID: ${escapeHtml(prereqId)}`,
        ),
      );
      return;
    }
  }

  const result = await createObject(
    repo,
    type,
    title,
    null,
    priority,
    status,
    prereqs,
    body,
  );
  const newObj = await resolveCreatedObj(repo, result.content[0]?.text ?? "");

  const okHeaders = {
    "Content-Type": "text/html",
    "HX-Trigger": "refreshTree",
  };

  if (!newObj) {
    res.writeHead(200, okHeaders);
    res.end(`<div data-view="view"><p>Created successfully.</p></div>`);
    return;
  }

  res.writeHead(200, okHeaders);
  res.end(await renderDetailView(key, newObj, repo));
}
