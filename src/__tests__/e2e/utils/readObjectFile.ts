import * as fs from "fs/promises";
import * as path from "path";
import { parse } from "yaml";
import { resolveDataDir } from "../../../configuration/resolveDataDir";
import { resolveProjectKey } from "../../../configuration/resolveProjectKey";

/**
 * Reads and parses object file
 */
export async function readObjectFile(
  projectRoot: string,
  relativePath: string,
) {
  const filePath = path.join(
    resolveDataDir(),
    "projects",
    resolveProjectKey(projectRoot),
    relativePath,
  );
  const content = await fs.readFile(filePath, "utf-8");
  const [, frontmatter, ...bodyParts] = content.split("---\n");
  return {
    yaml: parse(frontmatter),
    body: bodyParts.join("---\n").trim(),
    raw: content,
    exists: true,
  };
}
