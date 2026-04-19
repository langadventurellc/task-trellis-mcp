import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

/** Returns the git remote origin URL if available, otherwise the absolute project path. */
export function resolveProjectLabel(projectDir: string): string {
  try {
    const result = spawnSync("git", ["remote", "get-url", "origin"], {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 5000,
    });
    const url = result.stdout?.trim();
    if (!result.error && result.status === 0 && url) {
      return url;
    }
  } catch {
    // fall through
  }
  return resolve(projectDir);
}
