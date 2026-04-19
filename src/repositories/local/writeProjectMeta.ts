import { access, mkdir, writeFile } from "fs/promises";
import { join } from "path";

/** Writes meta.json to planningRoot if it does not already exist. Idempotent: existing file is never overwritten. */
export async function writeProjectMeta(
  planningRoot: string,
  label?: string,
): Promise<void> {
  const metaPath = join(planningRoot, "meta.json");
  try {
    await access(metaPath);
    return;
  } catch {
    // does not exist — write it
  }
  await mkdir(planningRoot, { recursive: true });
  const content = JSON.stringify({ label: label ?? planningRoot }, null, 2);
  await writeFile(metaPath, content, "utf8");
}
