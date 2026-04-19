import { createHash } from "node:crypto";
import { resolveProjectLabel } from "./resolveProjectLabel";

/** Returns a 12-char hex project key derived from git origin URL or absolute path. */
export function resolveProjectKey(projectDir: string): string {
  return createHash("sha1")
    .update(resolveProjectLabel(projectDir))
    .digest("hex")
    .slice(0, 12);
}
