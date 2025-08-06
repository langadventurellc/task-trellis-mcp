import { writeFile, mkdir, access, unlink } from "fs/promises";
import { dirname } from "path";
import { TrellisObject } from "../../models/TrellisObject";
import { TrellisObjectType } from "../../models/TrellisObjectType";
import { TrellisObjectStatus } from "../../models/TrellisObjectStatus";
import { isOpen } from "../../models";
import { serializeTrellisObject } from "../../utils/serializeTrellisObject";
import { getObjectFilePath } from "./getObjectFilePath";

/**
 * Gets the file path for a task in the opposite status folder (open <-> closed)
 * @param trellisObject - The task object
 * @param planningRoot - The root directory for the planning structure
 * @returns Promise<string> - The file path in the opposite status folder
 */
async function getOppositeStatusFilePath(
  trellisObject: TrellisObject,
  planningRoot: string,
): Promise<string> {
  // Create a copy of the object with opposite status to get the opposite path
  const oppositeStatusObject = { ...trellisObject };

  if (isOpen(trellisObject)) {
    // If currently open, use DONE to represent closed status
    oppositeStatusObject.status = TrellisObjectStatus.DONE;
  } else {
    // If currently closed, use OPEN to represent open status
    oppositeStatusObject.status = TrellisObjectStatus.OPEN;
  }

  return getObjectFilePath(oppositeStatusObject, planningRoot);
}

/**
 * Saves a Trellis object to the file system.
 * Determines the file path using getObjectFilePath and creates necessary directories.
 * For tasks, handles status transitions by cleaning up old files when moving between open/closed folders.
 * Overwrites existing files if they exist.
 *
 * @param trellisObject - The TrellisObject to save
 * @param planningRoot - The root directory for the planning structure
 * @returns Promise<string> - The file path where the object was saved
 */
export async function saveObject(
  trellisObject: TrellisObject,
  planningRoot: string,
): Promise<string> {
  const filePath = await getObjectFilePath(trellisObject, planningRoot);
  const serializedContent = serializeTrellisObject(trellisObject);

  // Handle task status transitions - check if we need to clean up old file
  let oldFilePath: string | null = null;
  if (trellisObject.type === TrellisObjectType.TASK) {
    try {
      const oppositeFilePath = await getOppositeStatusFilePath(
        trellisObject,
        planningRoot,
      );
      // Check if a file exists in the opposite status folder
      await access(oppositeFilePath);
      oldFilePath = oppositeFilePath;
    } catch {
      // File doesn't exist in opposite folder, which is fine
    }
  }

  // Ensure the directory exists before writing the file
  const dirPath = dirname(filePath);
  await mkdir(dirPath, { recursive: true });

  // Write the serialized content to the file (overwrites if exists)
  await writeFile(filePath, serializedContent, "utf8");

  // Clean up old file after successful save
  if (oldFilePath) {
    try {
      await unlink(oldFilePath);
    } catch (error) {
      // Log warning but don't fail the save operation
      console.warn(
        `Warning: Could not delete old task file ${oldFilePath}:`,
        error,
      );
    }
  }

  return filePath;
}
