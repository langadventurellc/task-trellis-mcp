import * as fs from "fs/promises";
import * as path from "path";
import { parse } from "yaml";

/**
 * Reads and parses object file
 */
export async function readObjectFile(
  projectRoot: string,
  relativePath: string,
) {
  const filePath = path.join(projectRoot, ".trellis", relativePath);
  const content = await fs.readFile(filePath, "utf-8");
  const [, frontmatter, ...bodyParts] = content.split("---\n");
  return {
    yaml: parse(frontmatter),
    body: bodyParts.join("---\n").trim(),
    raw: content,
    exists: true,
  };
}
