import * as fs from "fs/promises";
import * as path from "path";
import type { HierarchyOptions } from "./HierarchyOptions";

/**
 * Creates object file with proper directory structure
 */
export async function createObjectFile(
  projectRoot: string,
  objectType: string,
  objectId: string,
  content: string,
  hierarchy?: HierarchyOptions,
): Promise<void> {
  let relativePath: string;

  switch (objectType) {
    case "project": {
      relativePath = `p/${objectId}/${objectId}.md`;
      break;
    }
    case "epic": {
      if (!hierarchy?.projectId) throw new Error("Epic requires projectId");
      relativePath = `p/${hierarchy.projectId}/e/${objectId}/${objectId}.md`;
      break;
    }
    case "feature": {
      if (hierarchy?.epicId && hierarchy?.projectId) {
        relativePath = `p/${hierarchy.projectId}/e/${hierarchy.epicId}/f/${objectId}/${objectId}.md`;
      } else {
        relativePath = `f/${objectId}/${objectId}.md`;
      }
      break;
    }
    case "task": {
      const statusFolder = hierarchy?.status || "open";
      if (hierarchy?.featureId) {
        if (hierarchy?.epicId && hierarchy?.projectId) {
          relativePath = `p/${hierarchy.projectId}/e/${hierarchy.epicId}/f/${hierarchy.featureId}/t/${statusFolder}/${objectId}.md`;
        } else {
          relativePath = `f/${hierarchy.featureId}/t/${statusFolder}/${objectId}.md`;
        }
      } else {
        relativePath = `t/${statusFolder}/${objectId}.md`;
      }
      break;
    }
    default: {
      throw new Error(`Unknown object type: ${objectType}`);
    }
  }

  const filePath = path.join(projectRoot, ".trellis", relativePath);
  const dirPath = path.dirname(filePath);
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}
