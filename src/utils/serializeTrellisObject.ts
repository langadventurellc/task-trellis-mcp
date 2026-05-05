import { stringify } from "yaml";
import { TrellisObject } from "../models";
import { wrapDangerousScalars } from "./wrapDangerousScalars";

/**
 * Serializes a TrellisObject to a markdown string with YAML frontmatter
 * @param trellisObject - The TrellisObject to serialize
 * @returns A markdown string with YAML frontmatter
 */
export function serializeTrellisObject(trellisObject: TrellisObject): string {
  // Convert Map to plain object for YAML serialization
  const affectedFilesObj = Object.fromEntries(trellisObject.affectedFiles);

  // Create the frontmatter object (excluding body since it goes in the markdown content)
  const frontmatter = {
    id: trellisObject.id,
    title: trellisObject.title,
    status: trellisObject.status,
    priority: trellisObject.priority,
    parent: trellisObject.parent ?? "none",
    prerequisites: trellisObject.prerequisites,
    affectedFiles: affectedFilesObj,
    log: trellisObject.log,
    schema: trellisObject.schema,
    childrenIds: trellisObject.childrenIds,
    ...(trellisObject.labels.length > 0
      ? { labels: trellisObject.labels }
      : {}),
    created: trellisObject.created,
    updated: trellisObject.updated,
    ...(trellisObject.externalIssueId
      ? { externalIssueId: trellisObject.externalIssueId }
      : {}),
  };

  // Guard against bare --- lines in scalar values that would confuse the frontmatter extractor
  const yamlFrontmatter = stringify(wrapDangerousScalars(frontmatter)).trim();

  // Combine YAML frontmatter with markdown body
  const markdown = `---
${yamlFrontmatter}
---

${trellisObject.body}`;

  return markdown;
}
