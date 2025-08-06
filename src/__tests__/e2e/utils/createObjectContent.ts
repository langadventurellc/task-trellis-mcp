import { stringify } from "yaml";
import type { ObjectData } from "./ObjectData";

/**
 * Creates YAML frontmatter content for Trellis objects
 */
export function createObjectContent(data: ObjectData): string {
  const frontmatter = {
    ...(data.kind && { kind: data.kind }),
    id: data.id,
    title: data.title,
    status: data.status || (data.kind === "project" ? "draft" : "open"),
    priority: data.priority || "medium",
    ...(data.parent && { parent: data.parent }),
    prerequisites: data.prerequisites || [],
    ...(data.affectedFiles && { affectedFiles: data.affectedFiles }),
    ...(data.log && { log: data.log }),
    schema: data.schema || "1.0",
    ...(data.childrenIds && { childrenIds: data.childrenIds }),
    ...(data.created && { created: data.created }),
    ...(data.updated && { updated: data.updated }),
  };

  // Remove undefined values
  Object.keys(frontmatter).forEach((key) => {
    if ((frontmatter as any)[key] === undefined) {
      delete (frontmatter as any)[key];
    }
  });

  const yamlContent = stringify(frontmatter);
  return `---\n${yamlContent}---\n\n${data.body || ""}`;
}
