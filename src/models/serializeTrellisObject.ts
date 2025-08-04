import { stringify } from "yaml";
import { TrellisObject } from "./TrellisObject";

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
    prerequisites: trellisObject.prerequisites,
    affectedFiles: affectedFilesObj,
    log: trellisObject.log,
    schema: trellisObject.schema,
    childrenIds: trellisObject.childrenIds,
  };

  // Generate YAML frontmatter
  const yamlFrontmatter = stringify(frontmatter).trim();

  // Combine YAML frontmatter with markdown body
  const markdown = `---
${yamlFrontmatter}
---

${trellisObject.body}`;

  return markdown;
}
