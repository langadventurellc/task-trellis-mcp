import { readFile, readdir } from "fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { resolveDataDir } from "../configuration/resolveDataDir";
import { TrellisObjectStatus, isOpen } from "../models";
import { LocalRepository } from "../repositories/local/LocalRepository";
import { appShell } from "./appShell";
import { escapeHtml } from "./escapeHtml";

const HEADER = `<header class="landing-header">
    <div class="brand">
      <div class="brand-mark">TT</div>
      <div class="brand-name">Task Trellis</div>
    </div>
    <button class="icon-btn" id="theme-toggle" title="Toggle dark mode" aria-label="Toggle dark mode" type="button">
      <svg class="theme-icon-light"><use href="#i-moon"/></svg>
      <svg class="theme-icon-dark"><use href="#i-sun"/></svg>
    </button>
  </header>`;

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

  let content: string;

  if (keys.length === 0) {
    content = `<div class="landing-empty">
      <p>No projects found under <code>${escapeHtml(projectsDir)}</code>.</p>
    </div>`;
  } else {
    const cards = await Promise.all(
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

        const keyEsc = escapeHtml(key);
        const labelEsc = escapeHtml(label);
        const keyLine =
          label === key ? "" : `<div class="project-card-key">${keyEsc}</div>`;

        return `<a href="/projects/${keyEsc}" class="project-card">
          <div class="project-card-head">
            <div class="project-card-label">${labelEsc}</div>
            ${keyLine}
          </div>
          <div class="project-card-stats">
            <span class="badge status-open">${open} open</span>
            <span class="badge status-progress">${inProgress} in-progress</span>
            <span class="badge status-done">${done} done</span>
          </div>
        </a>`;
      }),
    );

    content = `<div class="project-list">${cards.join("\n")}</div>`;
  }

  const body = `<div class="landing">
  ${HEADER}
  <main class="landing-body">
    <h1 class="landing-title">Projects</h1>
    ${content}
  </main>
</div>`;

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(appShell("Task Trellis \u2014 Projects", body));
}
