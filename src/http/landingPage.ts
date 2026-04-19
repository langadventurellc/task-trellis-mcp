import { readFile, readdir } from "fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { resolveDataDir } from "../configuration/resolveDataDir";
import { TrellisObjectStatus, isOpen } from "../models";
import { LocalRepository } from "../repositories/local/LocalRepository";
import { escapeHtml } from "./escapeHtml";
import { page } from "./layout";

/** Handles GET / — lists all Trellis projects with issue counts. */
export async function landingPageHandler(
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const dataRoot = resolveDataDir();
  const projectsDir = join(dataRoot, "projects");

  let keys: string[] = [];
  try {
    const entries = await readdir(projectsDir, { withFileTypes: true });
    keys = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    // directory does not exist yet — fall through to empty state
  }

  let body: string;

  if (keys.length === 0) {
    body = `<h1>Task Trellis</h1>\n<p>No projects found under ${escapeHtml(projectsDir)}.</p>`;
  } else {
    const items = await Promise.all(
      keys.map(async (key) => {
        let label = key;
        try {
          const raw = await readFile(
            join(projectsDir, key, "meta.json"),
            "utf8",
          );
          const meta = JSON.parse(raw) as { label?: string };
          if (meta.label) label = meta.label;
        } catch {
          // fall back to key
        }

        const repo = new LocalRepository({
          planningRootFolder: join(projectsDir, key) + "/",
          autoCompleteParent: false,
          autoPrune: 0,
        });
        const objects = await repo.getObjects(true);
        const open = objects.filter(isOpen).length;
        const inProgress = objects.filter(
          (o) => o.status === TrellisObjectStatus.IN_PROGRESS,
        ).length;
        const done = objects.filter(
          (o) => o.status === TrellisObjectStatus.DONE,
        ).length;

        return `<li><a href="/projects/${escapeHtml(key)}">${escapeHtml(label)}</a> — ${open} open, ${inProgress} in-progress, ${done} done</li>`;
      }),
    );

    body = `<h1>Task Trellis</h1>\n<ul>\n${items.join("\n")}\n</ul>`;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(page("Task Trellis — Projects", body));
}
